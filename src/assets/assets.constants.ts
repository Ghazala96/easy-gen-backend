export enum AssetType {
  Email = 'email'
}

export enum AssetStatus {
  Pending = 'Pending',
  Verified = 'Verified',
  Unverified = 'Unverified',
  Failed = 'Failed'
}

export enum AssetOperation {
  Registration = 'registration',
  Login = 'login'
}

//TODO: Can be further optimized to be per asset type and per operation if exists
export const AssetExpiryInMinMap: Record<AssetType, number> = {
  [AssetType.Email]: 30 // Usually less than this in a prod environment
};

export const AssetKeyPrefixMap: Record<AssetType, string> = {
  [AssetType.Email]: AssetType.Email
};

export const AssetIdentifierAttributeMap: Record<AssetType, string> = {
  [AssetType.Email]: AssetType.Email
};

export const OperationalAssetTypes = [AssetType.Email];

export const RequiredAssets = {
  [AssetOperation.Registration]: [AssetType.Email]
};
