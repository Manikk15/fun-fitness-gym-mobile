type FirebaseLikeError = {
  code?: string;
};

const errorMessages: Record<string, string> = {
  'auth/invalid-credential': 'The email or password is incorrect.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/email-already-in-use': 'An account already exists for this email address.',
  'auth/weak-password': 'Choose a stronger password with at least 8 characters.',
  'auth/network-request-failed':
    'Network unavailable. Check your connection and try again.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/user-not-found': 'No account was found for this email address.',
  'permission-denied': 'You do not have permission to complete that action.',
  unavailable: 'The service is temporarily unavailable. Please try again.',
};

export function getFriendlyFirebaseError(error: unknown): string {
  const code = getFirebaseErrorCode(error);

  return code && errorMessages[code]
    ? errorMessages[code]
    : 'Something went wrong. Please try again.';
}

export function getFirebaseErrorCode(error: unknown): string | undefined {
  return (error as FirebaseLikeError).code;
}
