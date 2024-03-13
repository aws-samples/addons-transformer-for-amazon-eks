/* eslint-disable perfectionist/sort-object-types */
export type AddonData = {
    name: string,
    namespace: string,
    version: string
    helmChartUrl: string,
    helmChartUrlProtocol: string,
    containerImagesUrls?: string[],
    kubernetesVersion: string[],
    customConfiguration?: string[]
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

export const AllEksSupportedKubernetesVersions = [
    "1.23",
    "1.24",
    "1.25",
    "1.26",
    "1.27",
    "1.28"
]
