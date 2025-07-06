import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { LoginPageComponent } from './components/login-page/login-page.component';
import { RegisterPageComponent } from './components/register-page/register-page.component';


export const authRoutes: Routes = [
{
  path: '',
  component: AuthLayoutComponent,
  children:[
    {
      path: 'login',
      component:LoginPageComponent
    },
    {
      path: 'register',
      component:RegisterPageComponent
    },
    {
      path: '**',
      redirectTo: 'login'
    }
  ]
}
];

export default authRoutes;
