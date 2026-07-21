import { gql } from '@apollo/client';

/** Seeds the database with sample data. Used by SettingsPage and WelcomeOnboardingModal. */
export const SEED_DATABASE = gql`
  mutation SeedDatabase {
    seedDatabase
  }
`;

/** Wipes all data from the database. Used by SettingsPage. */
export const WIPE_DATABASE = gql`
  mutation WipeDatabase {
    wipeDatabase
  }
`;
