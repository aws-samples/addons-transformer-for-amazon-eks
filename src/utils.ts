export function getChartNameFromUrl(repoUrl:string):string {
    return repoUrl.substring(repoUrl.lastIndexOf('/')+1 ,repoUrl.length)
}

export function getProtocolFromFullQualifiedUrl(helmChartUrl: string) {
    return helmChartUrl?.substring(0, helmChartUrl?.indexOf(':'))
}

export function getRepoFromFullChartUri(helmChartUrl: string) {
    return helmChartUrl.substring(0, helmChartUrl.lastIndexOf(':'));
}

export function getVersionTagFromChartUri(helmChartUrl: string) {
    return helmChartUrl.lastIndexOf(':') ? `${helmChartUrl.substring(helmChartUrl.lastIndexOf(':') + 1)}` : '';
}