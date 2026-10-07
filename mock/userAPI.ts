interface MockResponse {
  json: (body: unknown) => void;
}

const users = [
  { id: 0, name: 'Umi', nickName: 'U', gender: 'MALE' },
  { id: 1, name: 'Fish', nickName: 'B', gender: 'FEMALE' },
];

export default {
  'GET /api/v1/queryUserList': (_req: unknown, res: MockResponse) => {
    res.json({
      success: true,
      data: { list: users },
      errorCode: 0,
    });
  },
  'PUT /api/v1/user/': (_req: unknown, res: MockResponse) => {
    res.json({
      success: true,
      errorCode: 0,
    });
  },
};
