#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';
import { config } from 'dotenv';
// Load environment variables
config();
class GitLabMCPServer {
    server;
    gitlabUrl;
    accessToken;
    constructor() {
        this.server = new Server({
            name: 'gitlab-mr-reviewer',
            version: '1.0.0',
        });
        this.gitlabUrl = process.env.GITLAB_URL || 'https://gitlab.com';
        this.accessToken = process.env.GITLAB_ACCESS_TOKEN || '';
        this.setupToolHandlers();
    }
    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'search_repositories',
                    description: 'Search for GitLab projects',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            search: {
                                type: 'string',
                                description: 'Search query',
                            },
                            page: {
                                type: 'number',
                                description: 'Page number for pagination (default: 1)',
                            },
                            per_page: {
                                type: 'number',
                                description: 'Number of results per page (default: 20)',
                            },
                        },
                        required: ['search'],
                    },
                },
                {
                    name: 'get_merge_request',
                    description: 'Get merge request details including changes',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            projectId: {
                                type: 'string',
                                description: 'GitLab project ID',
                            },
                            mergeRequestIid: {
                                type: 'string',
                                description: 'Merge request internal ID',
                            },
                            projectName: {
                                type: 'string',
                                description: 'Project name to search for if projectId not provided',
                            },
                        },
                        required: ['mergeRequestIid'],
                    },
                },
                {
                    name: 'get_merge_request_changes',
                    description: 'Get detailed file changes in merge request',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            projectId: {
                                type: 'string',
                                description: 'GitLab project ID',
                            },
                            mergeRequestIid: {
                                type: 'string',
                                description: 'Merge request internal ID',
                            },
                            projectName: {
                                type: 'string',
                                description: 'Project name to search for if projectId not provided',
                            },
                        },
                        required: ['mergeRequestIid'],
                    },
                },
                {
                    name: 'add_merge_request_note',
                    description: 'Add review comment thread to merge request that can be resolved',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            projectId: {
                                type: 'string',
                                description: 'GitLab project ID',
                            },
                            mergeRequestIid: {
                                type: 'string',
                                description: 'Merge request internal ID',
                            },
                            body: {
                                type: 'string',
                                description: 'Comment body',
                            },
                            position: {
                                type: 'object',
                                description: 'Position for inline comments on specific lines',
                                properties: {
                                    base_sha: { type: 'string' },
                                    start_sha: { type: 'string' },
                                    head_sha: { type: 'string' },
                                    old_path: { type: 'string' },
                                    new_path: { type: 'string' },
                                    position_type: { type: 'string', enum: ['text'] },
                                    old_line: { type: 'number' },
                                    new_line: { type: 'number' },
                                },
                            },
                            resolvable: {
                                type: 'boolean',
                                description: 'Make the comment thread resolvable (default: true)',
                            },
                        },
                        required: ['projectId', 'mergeRequestIid', 'body'],
                    },
                },
                {
                    name: 'get_merge_request_discussions',
                    description: 'Get all discussion threads in a merge request',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            projectId: {
                                type: 'string',
                                description: 'GitLab project ID',
                            },
                            mergeRequestIid: {
                                type: 'string',
                                description: 'Merge request internal ID',
                            },
                            projectName: {
                                type: 'string',
                                description: 'Project name to search for if projectId not provided',
                            },
                        },
                        required: ['mergeRequestIid'],
                    },
                },
                {
                    name: 'list_open_merge_requests',
                    description: 'Get all open merge requests in a project',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            projectId: {
                                type: 'string',
                                description: 'GitLab project ID',
                            },
                            projectName: {
                                type: 'string',
                                description: 'Project name to search for if projectId not provided',
                            },
                            page: {
                                type: 'number',
                                description: 'Page number for pagination (default: 1)',
                            },
                            per_page: {
                                type: 'number',
                                description: 'Number of results per page (default: 20)',
                            },
                        },
                        required: [],
                    },
                },
                {
                    name: 'resolve_merge_request_discussion',
                    description: 'Resolve or unresolve a discussion thread in merge request',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            projectId: {
                                type: 'string',
                                description: 'GitLab project ID',
                            },
                            mergeRequestIid: {
                                type: 'string',
                                description: 'Merge request internal ID',
                            },
                            discussionId: {
                                type: 'string',
                                description: 'Discussion thread ID',
                            },
                            resolved: {
                                type: 'boolean',
                                description: 'Whether to resolve (true) or unresolve (false) the discussion',
                            },
                        },
                        required: ['projectId', 'mergeRequestIid', 'discussionId', 'resolved'],
                    },
                },
                {
                    name: 'create_branch',
                    description: 'Create a new branch in a GitLab project',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            projectId: {
                                type: 'string',
                                description: 'GitLab project ID',
                            },
                            branch: {
                                type: 'string',
                                description: 'Name for the new branch',
                            },
                            ref: {
                                type: 'string',
                                description: 'Source branch/commit for new branch',
                            },
                        },
                        required: ['projectId', 'branch'],
                    },
                },
                {
                    name: 'create_merge_request',
                    description: 'Create a new merge request in a GitLab project',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            projectId: {
                                type: 'string',
                                description: 'GitLab project ID',
                            },
                            title: {
                                type: 'string',
                                description: 'Merge request title',
                            },
                            source_branch: {
                                type: 'string',
                                description: 'Branch containing changes',
                            },
                            target_branch: {
                                type: 'string',
                                description: 'Branch to merge into',
                            },
                            description: {
                                type: 'string',
                                description: 'Merge request description',
                            },
                        },
                        required: ['projectId', 'title', 'source_branch', 'target_branch'],
                    },
                },
                {
                    name: 'commit_files',
                    description: 'Commit one or multiple files to a branch in a GitLab project. Use this to push generated test scripts to the test repository.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            projectId: {
                                type: 'string',
                                description: 'GitLab project ID',
                            },
                            branch: {
                                type: 'string',
                                description: 'Branch to commit to',
                            },
                            commit_message: {
                                type: 'string',
                                description: 'Commit message',
                            },
                            actions: {
                                type: 'array',
                                description: 'Array of file actions to commit',
                                items: {
                                    type: 'object',
                                    properties: {
                                        action: {
                                            type: 'string',
                                            enum: ['create', 'update', 'delete'],
                                            description: 'Action to perform on the file',
                                        },
                                        file_path: {
                                            type: 'string',
                                            description: 'Path of the file in the repository',
                                        },
                                        content: {
                                            type: 'string',
                                            description: 'File content (required for create/update)',
                                        },
                                    },
                                    required: ['action', 'file_path'],
                                },
                            },
                        },
                        required: ['projectId', 'branch', 'commit_message', 'actions'],
                    },
                },
                {
                    name: 'get_file_content',
                    description: 'Get the content of a file from a GitLab repository',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            projectId: {
                                type: 'string',
                                description: 'GitLab project ID',
                            },
                            file_path: {
                                type: 'string',
                                description: 'Path of the file in the repository',
                            },
                            ref: {
                                type: 'string',
                                description: 'Branch or commit ref (default: main)',
                            },
                        },
                        required: ['projectId', 'file_path'],
                    },
                },
                {
                    name: 'get_pipeline_status',
                    description: 'Get the latest pipeline status for a branch or merge request',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            projectId: {
                                type: 'string',
                                description: 'GitLab project ID',
                            },
                            ref: {
                                type: 'string',
                                description: 'Branch name or commit SHA',
                            },
                            mergeRequestIid: {
                                type: 'string',
                                description: 'Merge request IID (alternative to ref)',
                            },
                        },
                        required: ['projectId'],
                    },
                },
            ],
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            if (!args) {
                throw new Error('Missing arguments');
            }
            const typedArgs = args;
            switch (name) {
                case 'search_repositories':
                    return this.searchRepositories(typedArgs.search, typedArgs.page, typedArgs.per_page);
                case 'get_merge_request':
                    return this.getMergeRequest(typedArgs.projectId, typedArgs.mergeRequestIid, typedArgs.projectName);
                case 'get_merge_request_changes':
                    return this.getMergeRequestChanges(typedArgs.projectId, typedArgs.mergeRequestIid, typedArgs.projectName);
                case 'add_merge_request_note':
                    return this.addMergeRequestNote(typedArgs.projectId, typedArgs.mergeRequestIid, typedArgs.body, typedArgs.position, typedArgs.resolvable);
                case 'get_merge_request_discussions':
                    return this.getMergeRequestDiscussions(typedArgs.projectId, typedArgs.mergeRequestIid, typedArgs.projectName);
                case 'list_open_merge_requests':
                    return this.listOpenMergeRequests(typedArgs.projectId, typedArgs.projectName, typedArgs.page, typedArgs.per_page);
                case 'resolve_merge_request_discussion':
                    return this.resolveMergeRequestDiscussion(typedArgs.projectId, typedArgs.mergeRequestIid, typedArgs.discussionId, typedArgs.resolved);
                case 'create_branch':
                    return this.createBranch(typedArgs.projectId, typedArgs.branch, typedArgs.ref);
                case 'create_merge_request':
                    return this.createMergeRequest(typedArgs.projectId, typedArgs.title, typedArgs.source_branch, typedArgs.target_branch, typedArgs.description);
                case 'commit_files':
                    return this.commitFiles(typedArgs.projectId, typedArgs.branch, typedArgs.commit_message, typedArgs.actions);
                case 'get_file_content':
                    return this.getFileContent(typedArgs.projectId, typedArgs.file_path, typedArgs.ref);
                case 'get_pipeline_status':
                    return this.getPipelineStatus(typedArgs.projectId, typedArgs.ref, typedArgs.mergeRequestIid);
                default:
                    throw new Error(`Unknown tool: ${name}`);
            }
        });
    }
    async gitlabRequest(endpoint, method = 'GET', body) {
        const url = `${this.gitlabUrl}/api/v4${endpoint}`;
        console.log(`Making GitLab API request: ${method} ${url}`);
        if (!this.accessToken) {
            throw new Error('GitLab access token is not configured');
        }
        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`GitLab API error: ${response.status} ${response.statusText}`, errorText);
            throw new Error(`GitLab API error: ${response.status} ${response.statusText} - ${errorText}`);
        }
        return response.json();
    }
    async searchRepositories(search, page, per_page) {
        try {
            const params = new URLSearchParams({
                search,
                page: page || '1',
                per_page: per_page || '20',
            });
            const projects = await this.gitlabRequest(`/projects?${params}`);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            count: projects.length,
                            items: projects.map(p => ({
                                id: p.id,
                                name: p.name,
                                path_with_namespace: p.path_with_namespace,
                                visibility: p.visibility,
                                web_url: p.web_url,
                                description: p.description,
                                ssh_url_to_repo: p.ssh_url_to_repo,
                                http_url_to_repo: p.http_url_to_repo,
                                created_at: p.created_at,
                                last_activity_at: p.last_activity_at,
                                default_branch: p.default_branch,
                            })),
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error searching repositories: ${error.message}`,
                    },
                ],
                isError: true,
            };
        }
    }
    async getProjectId(projectName) {
        try {
            // First try to find by exact name match
            const projects = await this.gitlabRequest(`/projects?search=${encodeURIComponent(projectName)}`);
            let project = projects.find(p => p.name === projectName);
            if (!project) {
                // Try to find by path_with_namespace containing the project name
                project = projects.find(p => p.path_with_namespace.includes(projectName));
            }
            if (!project && projectName === 'he-websites') {
                // Specific handling for he-websites project
                project = projects.find(p => p.path_with_namespace === 'idp-education/idp-connect/he-websites/next-js/he-websites' ||
                    p.path_with_namespace.endsWith('/he-websites'));
            }
            return project ? project.id.toString() : undefined;
        }
        catch (error) {
            console.error('Error finding project:', error);
            return undefined;
        }
    }
    async getMergeRequest(projectId, mergeRequestIid, projectName) {
        try {
            let finalProjectId = projectId;
            if (!finalProjectId && projectName) {
                finalProjectId = await this.getProjectId(projectName);
                if (!finalProjectId) {
                    throw new Error(`Project '${projectName}' not found`);
                }
            }
            if (!finalProjectId) {
                throw new Error('Either projectId or projectName must be provided');
            }
            const mr = await this.gitlabRequest(`/projects/${finalProjectId}/merge_requests/${mergeRequestIid}`);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            id: mr.id,
                            title: mr.title,
                            description: mr.description,
                            source_branch: mr.source_branch,
                            target_branch: mr.target_branch,
                            state: mr.state,
                            author: mr.author?.name,
                            created_at: mr.created_at,
                            updated_at: mr.updated_at,
                            web_url: mr.web_url,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error fetching merge request: ${error.message}`,
                    },
                ],
                isError: true,
            };
        }
    }
    async getMergeRequestChanges(projectId, mergeRequestIid, projectName) {
        try {
            let finalProjectId = projectId;
            if (!finalProjectId && projectName) {
                finalProjectId = await this.getProjectId(projectName);
                if (!finalProjectId) {
                    throw new Error(`Project '${projectName}' not found`);
                }
            }
            if (!finalProjectId) {
                throw new Error('Either projectId or projectName must be provided');
            }
            const changes = await this.gitlabRequest(`/projects/${finalProjectId}/merge_requests/${mergeRequestIid}/changes`);
            const formattedChanges = changes.changes.map((change) => ({
                old_path: change.old_path,
                new_path: change.new_path,
                new_file: change.new_file,
                renamed_file: change.renamed_file,
                deleted_file: change.deleted_file,
                diff: change.diff,
            }));
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            changes_count: changes.changes_count,
                            changes: formattedChanges,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error fetching merge request changes: ${error.message}`,
                    },
                ],
                isError: true,
            };
        }
    }
    async getMergeRequestDiscussions(projectId, mergeRequestIid, projectName) {
        try {
            let finalProjectId = projectId;
            if (!finalProjectId && projectName) {
                finalProjectId = await this.getProjectId(projectName);
                if (!finalProjectId) {
                    throw new Error(`Project '${projectName}' not found`);
                }
            }
            if (!finalProjectId) {
                throw new Error('Either projectId or projectName must be provided');
            }
            const discussions = await this.gitlabRequest(`/projects/${finalProjectId}/merge_requests/${mergeRequestIid}/discussions`);
            const formattedDiscussions = discussions.map((discussion) => ({
                id: discussion.id,
                resolvable: discussion.resolvable,
                resolved: discussion.resolved,
                notes_count: discussion.notes?.length || 0,
                created_at: discussion.created_at,
                updated_at: discussion.updated_at,
                first_note: discussion.notes?.[0] ? {
                    id: discussion.notes[0].id,
                    body: discussion.notes[0].body,
                    author: discussion.notes[0].author?.name,
                    position: discussion.notes[0].position,
                } : null,
            }));
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            discussions_count: discussions.length,
                            discussions: formattedDiscussions,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error fetching discussions: ${error.message}`,
                    },
                ],
                isError: true,
            };
        }
    }
    async listOpenMergeRequests(projectId, projectName, page, per_page) {
        try {
            let finalProjectId = projectId;
            if (!finalProjectId && projectName) {
                finalProjectId = await this.getProjectId(projectName);
                if (!finalProjectId) {
                    throw new Error(`Project '${projectName}' not found`);
                }
            }
            if (!finalProjectId) {
                throw new Error('Either projectId or projectName must be provided');
            }
            const params = new URLSearchParams({
                state: 'opened',
                page: page || '1',
                per_page: per_page || '20',
            });
            const mergeRequests = await this.gitlabRequest(`/projects/${finalProjectId}/merge_requests?${params}`);
            const formattedMRs = mergeRequests.map((mr) => ({
                id: mr.id,
                iid: mr.iid,
                title: mr.title,
                description: mr.description?.substring(0, 200) + (mr.description?.length > 200 ? '...' : ''),
                state: mr.state,
                source_branch: mr.source_branch,
                target_branch: mr.target_branch,
                author: mr.author?.name,
                assignees: mr.assignees?.map((a) => a.name) || [],
                reviewers: mr.reviewers?.map((r) => r.name) || [],
                created_at: mr.created_at,
                updated_at: mr.updated_at,
                web_url: mr.web_url,
                has_conflicts: mr.has_conflicts,
                merge_status: mr.merge_status,
            }));
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            total_count: mergeRequests.length,
                            merge_requests: formattedMRs,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error fetching open merge requests: ${error.message}`,
                    },
                ],
                isError: true,
            };
        }
    }
    async addMergeRequestNote(projectId, mergeRequestIid, body, position, resolvable) {
        try {
            const requestBody = { body };
            // Parse position if provided
            if (position) {
                try {
                    requestBody.position = JSON.parse(position);
                }
                catch (e) {
                    console.warn('Invalid position JSON, creating general comment');
                }
            }
            // Set resolvable (default to true for threaded discussions)
            if (resolvable !== undefined) {
                requestBody.resolvable = resolvable === 'true';
            }
            else {
                requestBody.resolvable = true;
            }
            const note = await this.gitlabRequest(`/projects/${projectId}/merge_requests/${mergeRequestIid}/discussions`, 'POST', requestBody);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            message: 'Discussion thread created successfully',
                            discussion_id: note.id,
                            resolvable: note.resolvable,
                            resolved: note.resolved,
                            notes_count: note.notes?.length || 1,
                            web_url: `${this.gitlabUrl}/-/merge_requests/${mergeRequestIid}#note_${note.notes?.[0]?.id || note.id}`,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error creating discussion thread: ${error.message}`,
                    },
                ],
                isError: true,
            };
        }
    }
    async resolveMergeRequestDiscussion(projectId, mergeRequestIid, discussionId, resolved) {
        try {
            const isResolved = resolved === 'true';
            const discussion = await this.gitlabRequest(`/projects/${projectId}/merge_requests/${mergeRequestIid}/discussions/${discussionId}`, 'PUT', { resolved: isResolved });
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            message: `Discussion thread ${isResolved ? 'resolved' : 'unresolved'} successfully`,
                            discussion_id: discussion.id,
                            resolved: discussion.resolved,
                            resolvable: discussion.resolvable,
                            notes_count: discussion.notes?.length || 0,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error ${resolved === 'true' ? 'resolving' : 'unresolving'} discussion: ${error.message}`,
                    },
                ],
                isError: true,
            };
        }
    }
    async createBranch(projectId, branch, ref) {
        try {
            const requestBody = { branch };
            if (ref) {
                requestBody.ref = ref;
            }
            const newBranch = await this.gitlabRequest(`/projects/${projectId}/repository/branches`, 'POST', requestBody);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            message: 'Branch created successfully',
                            name: newBranch.name,
                            commit: {
                                id: newBranch.commit?.id,
                                message: newBranch.commit?.message,
                                author_name: newBranch.commit?.author_name,
                                created_at: newBranch.commit?.created_at,
                            },
                            web_url: newBranch.web_url,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error creating branch: ${error.message}`,
                    },
                ],
                isError: true,
            };
        }
    }
    async createMergeRequest(projectId, title, source_branch, target_branch, description) {
        try {
            const requestBody = {
                title,
                source_branch,
                target_branch,
            };
            if (description) {
                requestBody.description = description;
            }
            const mr = await this.gitlabRequest(`/projects/${projectId}/merge_requests`, 'POST', requestBody);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            message: 'Merge request created successfully',
                            id: mr.id,
                            iid: mr.iid,
                            title: mr.title,
                            description: mr.description,
                            source_branch: mr.source_branch,
                            target_branch: mr.target_branch,
                            state: mr.state,
                            author: mr.author?.name,
                            created_at: mr.created_at,
                            web_url: mr.web_url,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error creating merge request: ${error.message}`,
                    },
                ],
                isError: true,
            };
        }
    }
    async commitFiles(projectId, branch, commit_message, actions) {
        try {
            const requestBody = {
                branch,
                commit_message,
                actions: actions.map(a => ({
                    action: a.action,
                    file_path: a.file_path,
                    content: a.content || '',
                })),
            };
            const commit = await this.gitlabRequest(`/projects/${projectId}/repository/commits`, 'POST', requestBody);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            message: 'Files committed successfully',
                            commit_id: commit.id,
                            short_id: commit.short_id,
                            title: commit.title,
                            author_name: commit.author_name,
                            created_at: commit.created_at,
                            web_url: commit.web_url,
                            files_changed: actions.length,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error committing files: ${error.message}`,
                    },
                ],
                isError: true,
            };
        }
    }
    async getFileContent(projectId, file_path, ref) {
        try {
            const encodedPath = encodeURIComponent(file_path);
            const refParam = ref ? `?ref=${encodeURIComponent(ref)}` : '';
            const file = await this.gitlabRequest(`/projects/${projectId}/repository/files/${encodedPath}/raw${refParam}`);
            return {
                content: [
                    {
                        type: 'text',
                        text: typeof file === 'string' ? file : JSON.stringify(file, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error fetching file content: ${error.message}`,
                    },
                ],
                isError: true,
            };
        }
    }
    async getPipelineStatus(projectId, ref, mergeRequestIid) {
        try {
            let pipelines;
            if (mergeRequestIid) {
                pipelines = await this.gitlabRequest(`/projects/${projectId}/merge_requests/${mergeRequestIid}/pipelines`);
            } else if (ref) {
                pipelines = await this.gitlabRequest(`/projects/${projectId}/pipelines?ref=${encodeURIComponent(ref)}&per_page=5`);
            } else {
                pipelines = await this.gitlabRequest(`/projects/${projectId}/pipelines?per_page=5`);
            }
            const latestPipelines = (Array.isArray(pipelines) ? pipelines : [pipelines]).slice(0, 5);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            pipeline_count: latestPipelines.length,
                            pipelines: latestPipelines.map(p => ({
                                id: p.id,
                                status: p.status,
                                ref: p.ref,
                                sha: p.sha?.substring(0, 8),
                                created_at: p.created_at,
                                updated_at: p.updated_at,
                                web_url: p.web_url,
                                source: p.source,
                            })),
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error fetching pipeline status: ${error.message}`,
                    },
                ],
                isError: true,
            };
        }
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
    }
}
const server = new GitLabMCPServer();
server.run().catch(console.error);
