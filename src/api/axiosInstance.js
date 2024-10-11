import axios from "axios";

import { ACCESS_TOKEN } from "../contants";
export const baseURL = "https://e-sign-pdf-be.vercel.app";
// export const baseURL = "http://localhost:3001";

export const axiosInstance = axios.create({
  baseURL,
});

axiosInstance.interceptors.request.use(
  (config) => {
    config.headers["Authorization"] = `Bearer ${localStorage.getItem(
      ACCESS_TOKEN
    )}`;

    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);
