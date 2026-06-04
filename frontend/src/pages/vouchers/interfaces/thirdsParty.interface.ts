export interface ThirdPartyInterface {
    id: string;
    name: string;
    code: string;
    roles: ThirdPartyRoleInterface[];
}

export interface ThirdPartyRoleInterface {
    name: string;
}