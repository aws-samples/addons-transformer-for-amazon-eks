export function getChartNameFromUrl(repoUrl:string):string {
    return repoUrl.substring(repoUrl.lastIndexOf('/')+1 ,repoUrl.length)
}
