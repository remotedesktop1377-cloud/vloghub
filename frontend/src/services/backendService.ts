export const backendService = {
  async isBackendReachable(): Promise<boolean> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL;
      if (!baseUrl) {
        return false;
      }
      const url = baseUrl.replace(/\/+$/, '');
      const response = await fetch(`${url}/health`, {
        method: 'GET',
      });
      // console.log('response: ', response);
      return response.ok;
    } catch {
      return false;
    }
  },
};


