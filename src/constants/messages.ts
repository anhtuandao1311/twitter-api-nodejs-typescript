export const USERS_MESSAGES = {
  VALIDATION_ERROR: 'Validation error',
  NAME_IS_REQUIRED: 'Name is required',
  NAME_MUST_BE_A_STRING: 'Name must be a string',
  NAME_MUST_BE_BETWEEN_3_AND_50_CHARACTERS: 'Name must be between 3 and 50 characters',
  EMAIL_IS_REQUIRED: 'Email is required',
  EMAIL_IS_INVALID: 'Email is invalid',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  PASSWORD_IS_REQUIRED: 'Password is required',
  PASSWORD_MUST_BE_A_STRING: 'Password must be a string',
  PASSWORD_MUST_BE_BETWEEN_6_AND_30_CHARACTERS: 'Password must be between 6 and 30 characters',
  PASSWORD_MUST_BE_STRONG:
    'Password must contain at least 6 characters, 1 lowercase, 1 uppercase, 1 number, and 1 symbol',
  CONFIRM_PASSWORD_IS_REQUIRED: 'Confirm password is required',
  CONFIRM_PASSWORD_MUST_BE_A_STRING: 'Confirm password must be a string',
  CONFIRM_PASSWORD_MUST_BE_BETWEEN_6_AND_30_CHARACTERS: 'Confirm password must be between 6 and 30 characters',
  CONFIRM_PASSWORD_MUST_BE_STRONG:
    'Confirm password must contain at least 6 characters, 1 lowercase, 1 uppercase, 1 number, and 1 symbol',
  PASSWORDS_DO_NOT_MATCH: 'Password and confirm password do not match',
  DATE_OF_BIRTH_IS_REQUIRED: 'Date of birth is required',
  DATE_OF_BIRTH_MUST_BE_ISO_8601: 'Date of birth must be in ISO 8601 format',
  EMAIL_OR_PASSWORD_IS_INCORRECT: 'Email or password is incorrect',
  REGISTERED_SUCCESSFULLY: 'Registered successfully',
  LOGGED_IN_SUCCESSFULLY: 'Logged in successfully',
  LOGGED_OUT_SUCCESSFULLY: 'Logged out successfully',
  ACCESS_TOKEN_IS_REQUIRED: 'Access token is required',
  ACCESS_TOKEN_IS_INVALID: 'Access token is invalid',
  REFRESH_TOKEN_IS_REQUIRED: 'Refresh token is required',
  REFRESH_TOKEN_IS_INVALID: 'Refresh token is invalid',
  REFRESH_TOKEN_USED_OR_DOES_NOT_EXIST: 'Refresh token used or does not exist',
  EMAIL_VERIFY_TOKEN_IS_REQUIRED: 'Email verify token is required',
  EMAIL_VERIFY_TOKEN_IS_INVALID: 'Email verify token is invalid',
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_VERIFIED: 'Email already verified',
  EMAIL_VERIFIED_SUCCESSFULLY: 'Email verified successfully',
  RESENT_EMAIL_VERIFY_SUCCESSFULLY: 'Resent email successfully',
  FORGOT_PASSWORD_EMAIL_SENT_SUCCESSFULLY: 'Forgot password email sent successfully',
  FORGOT_PASSWORD_TOKEN_IS_REQUIRED: 'Forgot password token is required',
  FORGOT_PASSWORD_TOKEN_IS_INVALID: 'Forgot password token is invalid',
  FORGOT_PASSWORD_TOKEN_IS_VALID: 'Forgot password token is valid',
  PASSWORD_RESET_SUCCESSFULLY: 'Password reset successfully',
  GET_ME_SUCCESSFULLY: 'Get profile successfully'
} as const
