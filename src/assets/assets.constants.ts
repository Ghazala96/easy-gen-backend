import { AssetType } from './schemas/asset.schema';

export const AssetExpiryInMinMap: Record<AssetType, number> = {
  [AssetType.Email]: 5
};

export const AssetKeyPrefixMap: Record<AssetType, string> = {
  [AssetType.Email]: 'email'
};

export const AssetIdentifierAttributeMap: Record<AssetType, string> = {
  [AssetType.Email]: 'email'
};
