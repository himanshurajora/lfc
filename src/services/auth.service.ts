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
  writeBatch,
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

    // Check if user is banned
    if (profile.banned) {
      await signOut(auth);
      throw new Error('BANNED');
    }

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
      const data = snapshot.data();

      // Migrate: if email exists in public doc, move it to private subcollection and remove it
      if (data.email) {
        const batch = writeBatch(db);
        batch.set(doc(db, 'users', user.uid, 'private', 'profile'), {
          email: data.email,
        }, { merge: true });
        batch.update(userRef, {
          email: '',
          avatarUrl: user.photoURL ?? '',
          updatedAt: serverTimestamp(),
        });
        await batch.commit();
      } else {
        // Update last-seen fields
        await setDoc(
          userRef,
          {
            avatarUrl: user.photoURL ?? '',
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      }

      // Fetch email from private subcollection for the current user
      const email = await this.getOwnEmail(user.uid);
      return { uid: user.uid, ...data, email } as UserProfile;
    }

    // First login — create profile
    const newProfile: Omit<UserProfile, 'uid'> = {
      email: '',
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

    // Write public profile + private email in a batch
    const batch = writeBatch(db);
    batch.set(userRef, newProfile);
    batch.set(doc(db, 'users', user.uid, 'private', 'profile'), {
      email: user.email ?? '',
    });
    await batch.commit();

    return { uid: user.uid, ...newProfile, email: user.email ?? '' };
  },

  /** Fetch a user profile by UID. */
  async getProfile(uid: string): Promise<UserProfile | null> {
    const snapshot = await getDoc(doc(db, 'users', uid));
    if (!snapshot.exists()) return null;
    return { uid: snapshot.id, ...snapshot.data(), email: '' } as UserProfile;
  },

  /** Fetch the current user's own email from the private subcollection. */
  async getOwnEmail(uid: string): Promise<string> {
    try {
      const snapshot = await getDoc(doc(db, 'users', uid, 'private', 'profile'));
      if (snapshot.exists()) {
        return (snapshot.data().email as string) ?? '';
      }
    } catch {
      // Other user’s private doc — permission denied is expected
    }
    return '';
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
