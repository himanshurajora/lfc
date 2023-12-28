/**
* This file was @generated using pocketbase-typegen
*/

import type PocketBase from 'pocketbase'
import type { RecordService } from 'pocketbase'

export enum Collections {
	Projects = "projects",
	Users = "users",
}

// Alias types for improved usability
export type IsoDateString = string
export type RecordIdString = string
export type HTMLString = string

// System fields
export type BaseSystemFields<T = never> = {
	id: RecordIdString
	created: IsoDateString
	updated: IsoDateString
	collectionId: string
	collectionName: Collections
	expand?: T
}

export type AuthSystemFields<T = never> = {
	email: string
	emailVisibility: boolean
	username: string
	verified: boolean
} & BaseSystemFields<T>

// Record types for each collection

export enum ProjectsLanguagesOptions {
	"javascript" = "javascript",
	"typescript" = "typescript",
	"rust" = "rust",
	"python" = "python",
	"markdown" = "markdown",
}
export type ProjectsRecord = {
	author: RecordIdString
	description: string
	github_repository: string
	home_page?: string
	languages: ProjectsLanguagesOptions[]
	name: string
	skill_level: number
}

export type UsersRecord = {
	avatar?: string
	name?: string
}

// Response types include system fields and match responses from the PocketBase API
export type ProjectsResponse<Texpand = unknown> = Required<ProjectsRecord> & BaseSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	projects: ProjectsRecord
	users: UsersRecord
}

export type CollectionResponses = {
	projects: ProjectsResponse
	users: UsersResponse
}

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = PocketBase & {
	collection(idOrName: 'projects'): RecordService<ProjectsResponse>
	collection(idOrName: 'users'): RecordService<UsersResponse>
}
