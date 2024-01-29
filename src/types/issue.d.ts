export type AddonData = {
    name: string,
    version: string
    helmChartUrl: string,
    helmChartUrlProtocol: string,
    containerImagesUrls: string[],
};

export type IssueData = {
    addon: AddonData;
    sellerMarketPlaceAlias: string,
};
