import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { WordpressService } from 'src/app/services/wordpress-service.service';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'app-post',
  templateUrl: './post.page.html',
  styleUrls: ['./post.page.scss'],
})
export class PostPage implements OnInit {
  public postId: number = 0;
  private activatedRoute = inject(ActivatedRoute);
  post: any;
  categories: any[] = [];
  baseUrl: string = environment.blogConfig.wpUrl;
  categoryDefinitonId: number = 85; // Adjust as neededfeaturedImageUrl: string = '';
  isLoading: boolean = false;

  constructor(translate: TranslateService, private wordpressService: WordpressService) { }

  ngOnInit() {
    const id: string | null = this.activatedRoute.snapshot.paramMap.get('id');
    if (id) {

      this.postId = Number.parseInt(id);

    }
    this.isLoading = true;
    this.loadPost().then(() => {
      //this.loadCategories();
      this.isLoading = false;
    });
  }

  async loadPost() {
    this.wordpressService.getPostById(this.postId).then((post) => {
      //console.log('Posts:', posts);
      this.post = post;
      // Assuming 'definition' has an 'featured_media' field you want to pass
      this.loadFeaturedImage(this.post.featured_media).then((url) => {
        this.post.featuredImageUrl = url;
      });
    });
  }

  async loadFeaturedImage(mediaId: number) {
    const featuredImageUrl = await this.wordpressService.getFeaturedImageUrl(mediaId);
    return featuredImageUrl;
  }

  cleanRender(excerpt: string) {
    return excerpt.replace(/\[…\]$/, '');  // Removes the ellipsis from the end of the excerpt
  }
}


