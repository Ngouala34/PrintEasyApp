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

//Interface réponse auth
export interface IAuthResponse {
    access: string;
    refresh: string;
    user?: {
        id: number;
        name: string;
        email: string;
        user_type: string;
    };
}

//Interface user login
export interface IUserLogin {
    email: string;
    password: string;
}