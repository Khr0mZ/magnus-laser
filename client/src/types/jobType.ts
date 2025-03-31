// Job type enum for difficulty modifier
export enum JobType {
    EASY = 'EASY',
    TYPICAL = 'TYPICAL',
    DANGEROUS = 'DANGEROUS',
}

// Get modifier value based on job type
export const getJobTypeModifier = (jobType: JobType): number => {
    switch (jobType) {
        case JobType.EASY:
            return 0
        case JobType.TYPICAL:
            return 1
        case JobType.DANGEROUS:
            return 2
        default:
            return 1
    }
}
