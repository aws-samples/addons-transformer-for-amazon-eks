export type AddonData = {
    name: string,
    version: string
};

export type IssueData = {
    addon: AddonData;
    sellerMarketPlaceAlias: string,
};
