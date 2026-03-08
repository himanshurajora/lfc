import {
  GithubAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { UserProfile } from '../types/user';

const provider = new GithubAuthProvider();
provider.addScope('read:user');
provider.addScope('user:email');

/**
 * Authentication service.
 *
 * Wraps Firebase Auth and manages the `users` collection for profile data.
 */
export const authService = {
  /** Sign in with GitHub pop-up. Creates a user profile if first login. */
  async loginWithGithub(): Promise<UserProfile> {
    const result = await signInWithPopup(auth, provider);
    const credential = GithubAuthProvider.credentialFromResult(result);
    const user = result.user;

    // Extract GitHub-specific data
    const githubUsername =
      (result.user as unknown as { reloadUserInfo?: { screenName?: string } })
        .reloadUserInfo?.screenName ?? user.displayName ?? '';

    const profile = await this.getOrCreateProfile(user, githubUsername, credential?.accessToken);
    return profile;
  },

  /** Sign out the current user. */
  async logout(): Promise<void> {
    await signOut(auth);
  },

  /** Subscribe to authentication state changes. */
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  /** Get or create a user profile document in Firestore. */
  async getOrCreateProfile(
    user: User,
    githubUsername: string,
    _accessToken?: string | null,
  ): Promise<UserProfile> {
    const userRef = doc(db, 'users', user.uid);
    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {
      // Update last-seen fields
      await setDoc(
        userRef,
        {
          avatarUrl: user.photoURL ?? '',
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      return { uid: user.uid, ...snapshot.data() } as UserProfile;
    }

    // First login — create profile
    const newProfile: Omit<UserProfile, 'uid'> = {
      email: user.email ?? '',
      displayName: user.displayName ?? githubUsername,
      username: githubUsername,
      avatarUrl: user.photoURL ?? '',
      bio: '',
      skills: [],
      githubUrl: `https://github.com/${githubUsername}`,
      websiteUrl: '',
      experienceLevel: 'beginner',
      projectsCreated: 0,
      contributionsCount: 0,
      createdAt: serverTimestamp() as UserProfile['createdAt'],
      updatedAt: serverTimestamp() as UserProfile['updatedAt'],
    };

    await setDoc(userRef, newProfile);
    return { uid: user.uid, ...newProfile };
  },

  /** Fetch a user profile by UID. */
  async getProfile(uid: string): Promise<UserProfile | null> {
    const snapshot = await getDoc(doc(db, 'users', uid));
    if (!snapshot.exists()) return null;
    return { uid: snapshot.id, ...snapshot.data() } as UserProfile;
  },

  /** Update the current user's profile. */
  async updateProfile(
    uid: string,
    data: Partial<UserProfile>,
  ): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await setDoc(
      userRef,
      { ...data, updatedAt: serverTimestamp() },
      { merge: true },
    );
  },

  /** Get the current Firebase Auth user synchronously (may be null). */
  getCurrentUser(): User | null {
    return auth.currentUser;
  },
};
