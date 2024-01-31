export type AddonData = {
    name: string,
    version: string
    helmChartUrl: string,
    helmChartUrlProtocol: string,
    containerImagesUrls: string[],
};
export enum ChartAutoCorrection {
    hooks = 'hooks',
    releaseService = 'releaseService',
}

export type IssueData = {
    addon: AddonData;
    sellerMarketPlaceAlias: string,
    chartAutoCorrection: ChartAutoCorrection[]
};
