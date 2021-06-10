const sha256 = require("crypto-js/sha256");
const ecLib = require('elliptic').ec;
const ec = new ecLib('secp256k1'); // curve name
// enum State { Origin, Factory, QA, Shipping, Received, Pending }
class Attribute {
    constructor(owner,attr_name,date,desc) {
        this.owner = owner;
        this.attr_name = attr_name;
        this.date = date;
        this.desc = desc;
    }
}

class Vendor {
    constructor(vendor_name,origin_addr,product_date,desc) {
        this.vendor_name = vendor_name;     //供应商
        this.origin_addr = origin_addr;     //生产地
        this.product_date = product_date;   //生产日期
        this.desc = desc;                   //描述信息
    }
}

class Logistics {
    constructor(logistics_name, logistics_addr, logistics_date, status, message) {
        this.logistics_name = logistics_name;
        this.logistics_addr = logistics_addr;
        this.logistics_date = logistics_date;
        this.status = status;
        this.message = message;
    }
}

class item {
    constructor(name,price,weight,state,lock,close,number,attr_number) {
        this.name = name;               //商品名称
        this.price = price;             //商品价格
        this.weight = weight;           //商品重量
        this.state = state;             //商品状态
        this.lock = lock;               //合约锁
        this.close = close;             //合约状态
        this.number = number;           //合约数量
        this.attr_number = attr_number;//属性数量
        this.attributes = new Map();
    }

    getName() {
        return this.name;
    }
    getPrice() {
        return this.price;
    }
    getWeight() {
        return this.weight;
    }
    setName(name) {
        if(this.lock === false){
            this.name = name;
        }
    }
    setPrice(price) {
        if(this.lock === false){
            this.price = price;
        }
    }
    setWeight(weight) {
        if (this.lock === false) {
            this.weight = weight;
        }
    }
    addAttribute(owner,attr_name,date,desc) {
        if (this.lock === false){
            this.attributes[attr_number] = Attribute(owner, attr_name, date, desc);
            this.attr_number += 1;
        }
    }
    getAttribute(attr_number) {
        if(attr_number < this.attr_number){
            return this.attributes[attr_number]
        }
        else{
            return this.attributes[0]
        }
    }
    setAttribute(attr_number,owner, attr_name, date, desc) {
        if(attr_number < this.attr_number && lock === false){
            this.attributes.delete(attr_number);
            this.attributes[attr_number] = Attribute(owner, attr_name, date, desc);
        }
    }
    // 签名需要private key
    sign(privateKey){
        // 验证你拥有这笔钱。privateKey和fromAddress对应的上
        this.signature =  privateKey.sign(this.computeHash(), 'base64').toDER('hex')
    }

    isValid(){
        // from Address 就是public key
        // 有两种类型的 transaction
        if(this.from === null)
            return true
        if(!this.signature)
            throw new Error('sig missing')
        const publicKey = ec.keyFromPublic(this.from, 'hex')
        return publicKey.verify(this.computeHash(), this.signature)
    }
}


class TraceBlock {
    constructor(items,previousHash) {
        this.items = items;
        this.previousHash = previousHash;
        this.timestamp = Date.now();
        this.nonce = 1;
        this.hash = this.computeHash();
    }

    computeHash() {
        // data 需要 stringify
        // JSON.stringify
        return sha256(
            JSON.stringify(this.items) +
            this.previousHash +
            this.nonce +
            this.timestamp
        ).toString();
    }
}

class TraceChain {
    constructor(items) {
        this.items = items
        this.chain = [this.bigBang()];
    }

    bigBang() {
        const genesisBlock = new TraceBlock("head","");
        return genesisBlock;
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }
}

module.exports = {TraceChain, TraceBlock, item}