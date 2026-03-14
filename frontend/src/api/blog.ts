import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
    withCredentials: true,
});

export interface Blog {
    id: string;
    title: string;
    slug: string;
    content: string;
    summary: string;
    cover_image: string;
    author: string;
    tags: string[];
    is_published: boolean;
    published_at?: string;
    created_at: string;
    updated_at: string;
}

export interface PaginationMeta {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

export interface BlogResponse {
    data: Blog[];
    meta: PaginationMeta;
}

export interface SingleBlogResponse {
    data: Blog;
}

export const blogApi = {
    // Public endpoints
    getPublicBlogs: async (page = 1, pageSize = 10): Promise<BlogResponse> => {
        const response = await api.get(`/blogs?page=${page}&pageSize=${pageSize}`);
        return response.data;
    },
    getBlogBySlug: async (slug: string): Promise<SingleBlogResponse> => {
        const response = await api.get(`/blogs/${slug}`);
        return response.data;
    },

    // Admin endpoints
    adminListBlogs: async (page = 1, pageSize = 20): Promise<BlogResponse> => {
        const response = await api.get(`/admin/blogs?page=${page}&pageSize=${pageSize}`);
        return response.data;
    },
    adminGetBlogById: async (id: string): Promise<SingleBlogResponse> => {
        const response = await api.get(`/admin/blogs/${id}`);
        return response.data;
    },
    createBlog: async (blog: Partial<Blog>): Promise<SingleBlogResponse> => {
        const response = await api.post('/admin/blogs', blog);
        return response.data;
    },
    updateBlog: async (id: string, blog: Partial<Blog>): Promise<SingleBlogResponse> => {
        const response = await api.put(`/admin/blogs/${id}`, blog);
        return response.data;
    },
    deleteBlog: async (id: string): Promise<void> => {
        await api.delete(`/admin/blogs/${id}`);
    }
};
