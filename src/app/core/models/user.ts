export interface User {
}

//Interface user register
export interface IUserRegister {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
    password_confirm: string;
}

export interface IRegisterResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  profile_picture?: string | null;
}

//Interface réponse auth
export interface IAuthResponse {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    role: string;
    access: string;
    refresh: string;
}

//Interface user login
export interface IUserLogin {
    email: string;
    password: string;
}

export interface IUserLoginResponse {
    access: string;
    refresh: string;
}


export interface IUserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: 'client' | 'admin' | 'staff';
  profile_picture: string | null;
  full_name: string;

}
