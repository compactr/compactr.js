export function deferred<T>() {
    let resolve: (value?: T | PromiseLike<T>) => void;
    let reject: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
  
    return { promise, resolve, reject };
  }
  
  export function sequence<T, K>(array: Array<K>, operation: (item: K, index: number) => Promise<T>): Promise<Array<T>> {
    return array.reduce((promiseChain: Promise<Array<T>>, item, index) => {
      return promiseChain.then((chainResults: Array<T>) => {
        return operation(item, index).then((currentResult) => [...chainResults, currentResult]);
      });
    }, Promise.resolve([]));
  }