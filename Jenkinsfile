@Library('pipeline-library@release/2.0.0') _

timeplayPipeline {
    builds = ['npmServerProject']

    nodeVersion = '10.15.2'

    genericArtifactoryPattern = "(*)"
    genericArtifactoryTarget = "{1}"
    chocolateyArtifactDir = "."
    chocolateyArtifactFileGlob = "**/*"

    chocolatey = [
        summary: "Timeplay Chocolatey Package to install Bingo OpCon",
        description: "A package containing the timeplay Bingo OpCon",
        defaultInstallDir: "C:\\TimePlayShips\\bingo-opcon",
    ]
}