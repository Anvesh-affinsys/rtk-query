import {
    createSlice,
    createSelector,
    createEntityAdapter
} from "@reduxjs/toolkit";
import {sub} from 'date-fns';
import {apiSlice} from "../api/apiSlice";

const postsAdapter = createEntityAdapter({
    sortComparer: (a, b) => b.date.localeCompare(a.date)
})

const initialState = postsAdapter.getInitialState()

export const extendedApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getPosts: builder.query({
            query: () => '/posts',
            transformResponse: responseData => {
                let min = 1;
                const loadedPosts = responseData.map(post => {
                    if (!post?.date) post.date = sub(new Date(), {minutes: min++}).toISOString();
                    if (!post?.reactions) post.reactions = {
                        thumbsUp: 0,
                        wow: 0,
                        heart: 0,
                        coffee: 0,
                        rocket: 0
                    }
                    return post;
                });
                return postsAdapter.setAll(initialState, loadedPosts);
            },
            providesTags: (results, error, arg) => [
                {type: "Post", id: "LIST"},
                ...results.ids.map(id => ({type: 'Post', id}))
            ]
        }),
        getPostsByUserId: builder.query({
            query: id => `/posts/?userId=${id}`,
            transformResponse: responseData => {
                let min = 1;
                const loadedPosts = responseData.map(post => {
                    if (!post?.date) post.date = sub(new Date(), {minutes: min++}).toISOString();
                    if (!post?.reactions) post.reactions = {
                        thumbsUp: 0,
                        wow: 0,
                        heart: 0,
                        coffee: 0,
                        rocket: 0
                    }
                    return post;
                })
                return postsAdapter.setAll(initialState, loadedPosts);
            },
            providesTags: (results, error, arg) => [
                ...results.ids.map(id => ({type: 'Post', id}))
            ]
        }),
        addNewPost: builder.mutation({
            query: initialPost => ({
                url: '/posts',
                method: "POST",
                body: {
                    ...initialPost,
                    userId: Number(initialPost.userId),
                    date: new Date().toISOString(),
                    reactions: {
                        thumbsUp: 0,
                        wow: 0,
                        heart: 0,
                        rocket: 0,
                        coffee: 0
                    }
                }
            }),
            invalidatesTags: [
                {type: "Post", id: "LIST"}
            ]
        }),

    })
})

export const {useGetPostsQuery, useGetPostsByUserIdQuery} = extendedApiSlice

//returns the query result object
export const selectPostsResult = extendedApiSlice.endpoints.getPosts.select();

//Creates memoized selector
const selectPostsData = createSelector(
    selectPostsResult,
    postsResult => postsResult.data
)


//getSelectors creates these selectors and we rename them with aliases using destructuring
export const {
    selectAll: selectAllPosts,
    selectById: selectPostById,
    selectIds: selectPostIds
    // Pass in a selector that returns the posts slice of state
} = postsAdapter.getSelectors(state => selectPostsData(state) ?? initialState)


