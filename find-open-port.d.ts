declare module 'find-open-port' {
    interface FindOpenPortOptions {
        startingPort?: number;
        endingPort?: number;
        host?: string;
    }

    function findOpenPort(options: FindOpenPortOptions): Promise<number>;

    export = findOpenPort;
}
