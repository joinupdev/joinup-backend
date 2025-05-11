export const USER_PROFILE_SELECT = {
  userId: true,
  name: true,
  gender: true,
  profession: true,
  jobTitle: true,
  place: true,
  linkedin: true,
  linkedinVisibility: true,
  github: true,
  twitter: true,
  website: true,
  bio: true,
  avatar: true,
  user: {
    select: {
      email: true,
      mobileNo: true,
    },
  },
} as const;
