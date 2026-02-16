interface Member {
    _id: string;
    name: string;
    role: string;
}

interface Criteria {
  minimumWalletBalance?: number;
}

type EditableGroupFields = {
  groupName: string;
  description?: string;
  groupType: string;
  maxGroupSize: number;
  criteria?: {
    minimumWalletBalance?: number;
  };
};

interface Participants {
  _id: string;
  name: string;
}

interface CampaignDetails {
  endDate: Date;
  savingsDay: number;
  participants: Participants[];
  amountPerMonth: number;
  penaltyAmount: number;
  totalSaved: number;
}

interface GroupDetails {
  _id: string;
  groupName: string;
  description: string;
  groupType: string;
  maxGroupSize: number;
  remainingSeats: number;
  admin: {
    _id: string;
  };
  criteria: Criteria;
  members: Member[];
  activeCampaign: {
    _id: string;
    campaignName: string;
    startDate: Date;
    durationInMonths: number;
    status: string;
  }
}

interface PendingRequests {
  _id: string;
  name: string;
}

interface RegularCampaign {
  _id: string;
  campaignName: string;
  amountPerMonth: number;
  totalAmount: number;
  amountSaved: number;
  startDate: string;
  endDate: string;
}

interface FlexibleCampaign {
  _id: string;
  campaignName: string;
  frequency: string;
  amountPerContribution: number;
  totalAmount: number;
  amountSaved: number;
  startDate: string;
  endDate: string;
}


interface WalletTopUp {
    amount: number;
    status: "success" | "failed";
    date: string;
}

interface WalletHistoryProps {
  initialTopups: WalletTopUp[];
  initialTotalPages: number;
}


interface GroupPageData {
    group: {
        _id: string;
        groupName: string;
        description: string;
        groupType: 'public' | 'private';
        admin: {
            _id: string;
            name: string;
        };
        maxGroupSize: number;
        criteria: Criteria;
    };
    members: {
        _id: string;
        name: string;
        role: 'admin' | 'member';
    }[];
    pendingMembers: {
        _id: string;
        name: string;
    }[];
    userRole: 'admin' | 'member' | null;
    userMembershipStatus: 'pending' | 'active' | 'rejected' | 'left' | null;
    activeCampaign: {
        _id: string;
        campaignName: string;
        startDate: string;
        durationInMonths: number;
        status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
    } | null;
    isFull: boolean;
    remainingSeats: number;
}