// Components
export { CommunicationRow } from './CommunicationRow';
export { ComposeEmailModal } from './ComposeEmailModal';
export { CommunicationDetail } from './CommunicationDetail';

// Config and types
export {
  typeConfig,
  filterOptions,
  directionOptions,
  isSentToInvestor,
} from './communicationsConfig';

export type {
  Communication,
  CommunicationType,
  FilterType,
  DirectionFilter,
  TypeConfig,
  FilterOption,
  DirectionOption,
} from './communicationsConfig';

// Mock data
export { mockDeals, mockInvestors } from './communicationsMockData';
export type { MockDeal, MockInvestor } from './communicationsMockData';
