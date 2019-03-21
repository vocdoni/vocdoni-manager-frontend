import { Process, Census, Entity } from 'dvote-client'
// export { IEntity } from 'dvote-client/dist/dvote/entity'

// TODO: Refactor: The dvote-client library should be able to provide such functionality

export default class DvoteUtil {

    public census: Census
    public process: Process
    public entity: Entity;

    public initProcess(web3Provider: any, votingSmartContractAddress: string) {
        this.process = new Process(web3Provider, votingSmartContractAddress)
    }

    public initCensus(censusServiceUrl: string) {
        this.census = new Census()
        this.census.initCensusService(censusServiceUrl)
    }

    public initEntity(web3Provider: any, entitySmartContractAddress:string){
        this.entity = new Entity(web3Provider, entitySmartContractAddress)
    }

    public getProcessess = async (organizerAddress: string) => {
        let processess = await this.process.getProcessesIdsByOrganizer(organizerAddress)
        let details = {}

        for (let processId of processess) {
            let metadata = await this.process.getMetadata(processId)
            details[metadata.id] = metadata
        }
        return details
    }

    public getEntityDetails = async (organizerAddress:string) =>
    {
        let details = await this.entity.get(organizerAddress)
        return details
    }

    public getUsersRegisryList= async()=>
    {
        try {
            const response = await fetch(process.env.MANAGER_URL + "/users")
            const users = await response.json()
            return users
        }
        catch (err) {
            console.error(err)
            return []
        }
    }
}