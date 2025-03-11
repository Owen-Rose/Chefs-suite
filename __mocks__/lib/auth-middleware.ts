export const withApiAuth = jest.fn((handler) => handler);
export const ExtendedNextApiRequest = {};

export const mockReqUser = {
    id: 'mock-user-id',
    role: 'ADMIN',
    hasPermission: jest.fn().mockReturnValue(true)
};