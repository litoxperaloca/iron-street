import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CapacitorHttp } from '@capacitor/core';
import { environment } from 'src/environments/environment';
import { WordpressService } from '../../services/wordpress-service.service';
@Component({
  selector: 'app-blog',
  templateUrl: './blog.page.html',
  styleUrls: ['./blog.page.scss'],
})
export class BlogPage implements OnInit {
  blogPosts: any[] = [];
  categories: any[] = [];
  baseUrl: string = environment.blogConfig.wpUrl;
  categoryDefinitonId: number = 85; // Adjust as neededfeaturedImageUrl: string = '';
  isLoading: boolean = false;
  async loadFeaturedImage(mediaId: number) {
    const featuredImageUrl = await this.wordpressService.getFeaturedImageUrl(mediaId);
    return featuredImageUrl;
  }
  constructor(private wordpressService: WordpressService, private router: Router) { }

  ngOnInit() {
    this.isLoading = true;
    this.loadBlogPosts().then(() => {
      //this.loadCategories();
      this.isLoading = false;
    });
  }

  async loadBlogPosts() {
    this.wordpressService.getPosts(this.categoryDefinitonId).then((posts) => {
      //console.log('Posts:', posts);
      this.blogPosts = posts;
      this.blogPosts.forEach((post) => {

        // Assuming 'definition' has an 'featured_media' field you want to pass
        this.loadFeaturedImage(post.featured_media).then((url) => {
          post.featuredImageUrl = url;
        });
      });
    });
  }

  cleanRender(excerpt: string) {
    return excerpt.replace(/\[…\]$/, '');  // Removes the ellipsis from the end of the excerpt
  }

  async loadCategories() {
    this.categories = await this.wordpressService.getCategories();

    // Additional logic to filter for "IronStreet" child categories if needed
  }
  async getCategoryDefinitions() {
    try {
      const response = await CapacitorHttp.get({
        url: `${this.baseUrl}posts?categories=${this.categoryDefinitonId}&per_page=100`, // Adjust per_page as needed
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching category definitions:', error);
      throw error;
    }
  }

  selectPost(definition: any) {
    // Assuming 'definition' has an 'id' field you want to pass
    if (definition && definition.id && definition.id > 0 && this.router) {
      this.router.navigate(['/category-detail', definition.id]);
    }
  }
}
