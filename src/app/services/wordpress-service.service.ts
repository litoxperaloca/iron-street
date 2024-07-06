import { Injectable } from '@angular/core';
import { CapacitorHttp } from '@capacitor/core';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class WordpressService {
  private baseUrl: string = environment.blogConfig.wpUrl;
  constructor() { }

  async getCategoryDefinitions() {
    try {
      const response = await CapacitorHttp.get({
        url: this.baseUrl + `posts?categories=85&per_page=100`, // Adjust per_page as needed
      });
      return JSON.parse(response.data);
    } catch (error) {
      console.error('Error fetching category definitions:', error);
      throw error;
    }
  }
  async getFeaturedImageUrl(mediaId: number): Promise<string> {
    const url = `${this.baseUrl}/media/${mediaId}`;

    try {
      const response = await CapacitorHttp.get({ url });
      const mediaData = response.data;

      // Assuming response.data is already parsed JSON; if not, use JSON.parse(response.data)
      return mediaData.source_url;
    } catch (error) {
      console.error('Error fetching featured image:', error);
      return '';
    }
  }

  async getPosts(categoryId: number) {
    try {
      const response = await CapacitorHttp.get({
        url: environment.blogConfig.wpUrl + `/posts?categoryId=${categoryId}&per_page=5`,
        headers: {}, // Add any required headers here
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }

  async getPostById(id: number) {
    try {
      const response = await CapacitorHttp.get({
        url: environment.blogConfig.wpUrl + `/posts/${id}`,
        headers: {}, // Add any required headers here
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  }

  async getCategories() {
    try {
      const response = await CapacitorHttp.get({
        url: environment.blogConfig.wpUrl + '/wp-json/wp/v2/categories',
        headers: {}, // Add any required headers here
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  async getPostsByCategory(categoryId: number) {
    try {
      const response = await CapacitorHttp.get({
        url: environment.blogConfig.wpUrl + `?categories=${categoryId}&per_page=5`,
        headers: {}, // Add any required headers here
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }

  async getTags() {
    try {
      const response = await CapacitorHttp.get({
        url: 'environment.blogConfig.wpUrl/wp-json/wp/v2/tags',
        headers: {}, // Add any required headers here
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
  }

  async getPostsByTag(tagId: number) {
    try {
      const response = await CapacitorHttp.get({
        url: environment.blogConfig.wpUrl + `?tags=${tagId}&per_page=5`,
        headers: {}, // Add any required headers here
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }

  async getMediaById(mediaId: number) {
    try {
      const response = await CapacitorHttp.get({
        url: `environment.blogConfig.wpUrl/wp-json/wp/v2/media/${mediaId}`,
        headers: {}, // Add any required headers here
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching media:', error);
      throw error;
    }
  }

  async getMediaByPostId(postId: number) {
    try {
      const response = await CapacitorHttp.get({
        url: `environment.blogConfig.wpUrl/wp-json/wp/v2/media?parent=${postId}`,
        headers: {}, // Add any required headers here
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching media:', error);
      throw error;
    }
  }

  async getCommentsByPostId(postId: number) {
    try {
      const response = await CapacitorHttp.get({
        url: `environment.blogConfig.wpUrl/wp-json/wp/v2/comments?post=${postId}`,
        headers: {}, // Add any required headers here
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }

  async getCommentById(commentId: number) {
    try {
      const response = await CapacitorHttp.get({
        url: `environment.blogConfig.wpUrl/wp-json/wp/v2/comments/${commentId}`,
        headers: {}, // Add any required headers here
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching comment:', error);
      throw error;
    }
  }

  async createComment(comment: any) {
    try {
      const response = await CapacitorHttp.post({
        url: 'environment.blogConfig.wpUrl/wp-json/wp/v2/comments',
        headers: {}, // Add any required headers here
        data: comment,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  async updateComment(comment: any) {
    try {
      const response = await CapacitorHttp.put({
        url: `environment.blogConfig.wpUrl/wp-json/wp/v2/comments/${comment.id}`,
        headers: {}, // Add any required headers here
        data: comment,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  async deleteComment(commentId: number) {
    try {
      const response = await CapacitorHttp.delete({
        url: `environment.blogConfig.wpUrl/wp-json/wp/v2/comments/${commentId}`,
        headers: {}, // Add any required headers here
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  async getTaxonomies() {
    try {
      const response = await CapacitorHttp.get({
        url: 'environment.blogConfig.wpUrl/wp-json/wp/v2/taxonomies',
        headers: {}, // Add any required headers here
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching taxonomies:', error);
      throw error;
    }
  }

  async getTaxonomyById(taxonomyId: number) {
    try {
      const response = await CapacitorHttp.get({
        url: `environment.blogConfig.wpUrl/wp-json/wp/v2/taxonomies/${taxonomyId}`,
        headers: {}, // Add any required headers here
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching taxonomy:', error);
      throw error;
    }
  }

  async getTermsByTaxonomy(taxonomyId: number) {
    try {
      const response = await CapacitorHttp.get({
        url: `environment.blogConfig.wpUrl/wp-json/wp/v2/terms?taxonomy=${taxonomyId}`,
        headers: {}, // Add any required headers here
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching terms:', error);
      throw error;
    }
  }

  async getTermById(termId: number) {
    try {
      const response = await CapacitorHttp.get({
        url: `environment.blogConfig.wpUrl/wp-json/wp/v2/terms/${termId}`,
        headers: {}, // Add any required headers here
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching term:', error);
      throw error;
    }
  }

  async getPostsByTerm(termId: number) {
    try {
      const response = await CapacitorHttp.get({
        url: environment.blogConfig.wpUrl + `?tags=${termId}&per_page=5`,
        headers: {}, // Add any required headers here
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }

  async getPostTypes() {
    try {
      const response = await CapacitorHttp.get({
        url: 'environment.blogConfig.wpUrl/wp-json/wp/v2/types',
        headers: {}, // Add any required headers here
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching post types:', error);
      throw error;
    }
  }

  async getPostTypeById(postTypeId: number) {
    try {
      const response = await CapacitorHttp.get({
        url: `environment.blogConfig.wpUrl/wp-json/wp/v2/types/${postTypeId}`,
        headers: {}, // Add any required headers here
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching post type:', error);
      throw error;
    }
  }



}

