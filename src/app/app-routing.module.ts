import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'welcome',
    pathMatch: 'full'
  },
  {
    path: 'welcome',
    loadChildren: () => import('./pages/welcome/welcome.module').then(m => m.WelcomePageModule)
  },
  {
    path: 'folder/:id',
    loadChildren: () => import('./pages/folder/folder.module').then(m => m.FolderPageModule)
  },
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then(m => m.HomePageModule)
  },
  {
    path: 'blog',
    loadChildren: () => import('./pages/blog/blog.module').then(m => m.BlogPageModule)
  },
  {
    path: 'auth',
    loadChildren: () => import('./pages/auth/auth.module').then(m => m.AuthPageModule)
  },
  {
    path: 'conf',
    loadChildren: () => import('./pages/conf/conf.module').then(m => m.ConfPageModule)
  },
  {
    path: 'rewards',
    loadChildren: () => import('./pages/rewards/rewards.module').then(m => m.RewardsPageModule)
  },
  {
    path: 'about',
    loadChildren: () => import('./pages/about/about.module').then(m => m.AboutPageModule)
  },
  {
    path: 'driving',
    loadChildren: () => import('./pages/driving/driving.module').then(m => m.DrivingPageModule)
  },
  {
    path: 'help',
    loadChildren: () => import('./pages/help/help.module').then(m => m.HelpPageModule)
  },
  {
    path: 'privacy',
    loadChildren: () => import('./pages/privacy/privacy.module').then(m => m.PrivacyPageModule)
  },
  {
    path: 'tos',
    loadChildren: () => import('./pages/tos/tos.module').then(m => m.TosPageModule)
  },
  {
    path: 'contact',
    loadChildren: () => import('./pages/contact/contact.module').then(m => m.ContactPageModule)
  },
  {
    path: 'subscribe',
    loadChildren: () => import('./pages/subscribe/subscribe.module').then(m => m.SubscribePageModule)
  },
  {
    path: 'tips',
    loadChildren: () => import('./pages/tips/tips.module').then(m => m.TipsPageModule)
  },
  {
    path: 'post/:id',
    loadChildren: () => import('./pages/post/post.module').then(m => m.PostPageModule)
  }


];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
