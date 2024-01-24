export type AddonData = {
    name: string,
    version: string
    helmChartUrl: string,
};

export type IssueData = {
    addon: AddonData;
    sellerMarketPlaceAlias: string,
};
