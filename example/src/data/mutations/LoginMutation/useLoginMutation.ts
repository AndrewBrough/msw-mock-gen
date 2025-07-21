
import { User } from "@data/types/User/User";
import { DefaultError, useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

export type LoginData = User;

export interface LoginVariables {
  email: string;
  password: string;
}

export const LOGIN_MUTATION_KEY = "LOGIN_MUTATION_KEY";

export const useLoginMutation = <
  D extends LoginData,
  V extends LoginVariables,
>() => {
  const navigate = useNavigate();

  return useMutation<D, DefaultError, V>({
    mutationKey: [LOGIN_MUTATION_KEY],
    mutationFn: (variables) => {
      return fetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(variables),
      }).then((res) => res.json());
    },
    onSuccess: (data) => {
      navigate({ to: "/dashboard", params: {
        data
      } });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};
