import * as SecureStore from "expo-secure-store";

export const useAuth = () => {
  const getAccessToken = async () => {
    return await SecureStore.getItemAsync("accessToken");
  };

  const getRefreshToken = async () => {
    return await SecureStore.getItemAsync("refreshToken");
  };

  const getToken = async () => {
    const accessToken = await getAccessToken();
    const refreshToken = await getRefreshToken();
    return { accessToken, refreshToken };
  };

  const saveToken = async (accessToken: string, refreshToken: string) => {
    await SecureStore.setItemAsync("accessToken", accessToken);
    await SecureStore.setItemAsync("refreshToken", refreshToken);
  };

  const deleteToken = async () => {
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
  };

  return {
    getAccessToken,
    getRefreshToken,
    getToken,
    saveToken,
    deleteToken,
  };
};
