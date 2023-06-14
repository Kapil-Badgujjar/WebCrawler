class Queue{
    constructor(){
        this.elements={};
        this.head=0;
        this.tail=0;
    }
    enqueue(element){
        this.elements[this.tail]=element;
        this.tail++;
    }
    dequeue(){
        const item = this.elements[this.head];
        if(this.length()>0){
            delete this.elements[this.head];
            this.head++;
            return item;
        }
        else return undefined;
    }
    peak(){
        if(this.length()>0)
            return this.elements[this.head];
        else return undefined;
    }
    length(){
        return this.tail -  this.head;
    }
    isEmpty(){
        return this.length === 0;
    }
}

module.exports = {Queue};