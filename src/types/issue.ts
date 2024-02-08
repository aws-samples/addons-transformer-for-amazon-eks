export type AddonData = {
    name: string,
    version: string
    helmChartUrl: string,
    helmChartUrlProtocol: string,
    containerImagesUrls: string[],
};

export type ChartAutoCorrection = {
    hooks:boolean,
    capabilities:boolean
    releaseService:boolean
}

export type IssueData = {
    addon: AddonData;
    sellerMarketPlaceAlias: string,
    chartAutoCorrection: ChartAutoCorrection
};
