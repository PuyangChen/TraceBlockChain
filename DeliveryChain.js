const sha256 = require("crypto-js/sha256");
const ecLib = require('elliptic').ec;
const ec = new ecLib('secp256k1'); // curve name
// enum State { Origin, Factory, QA, Shipping, Received, Pending }

// class User {
//     constructor() {
//     }
// }
//订单类
class Order {
    constructor(name,weight,price,from,to) {
        this.name = name;           //商品名称
        this.weight = weight;       //商品重量
        this.price = price;         //商品价格
        this.from = from;           //卖家
        this.to = to;               //买家
    }
    getName() {
        return this.name;
    }
    setName(name) {
        this.name = name;
    }
    getWeight() {
        return this.weight;
    }
    setWeight(weight) {
        this.weight = weight;
    }
    getPrice() {
        return this.price;
    }
    setPrice(price) {
        this.price = price;
    }
    getFrom() {
        return this.from;
    }
    setFrom(from) {
        return this.from;
    }
    getTo() {
        return this.to;
    }
    setTo(to) {
        return this.to;
    }

    computeHash(){
        return sha256(
            this.name +
            this.weight +
            this.price +
            this.from +
            this.to
        ).toString();
    }

    // 签名需要private key
    sign(privateKey){
        // 验证你拥有这笔钱。privateKey和fromAddress对应的上
        this.signature =  privateKey.sign(this.computeHash(), 'base64').toDER('hex')
    }
    //验证订单合法性
    isValid(){
        // from Address 就是public key
        // 有两种类型的 transaction
        if(!this.signature){
            // throw new Error('signature missing');
            console.log('signature missing');
        }

        const publicKey = ec.keyFromPublic(this.from, 'hex')
        return publicKey.verify(this.computeHash(), this.signature)
    }
    //验证卖家权限
    verify(privateKey) {
        const signature = privateKey.sign(this.computeHash(),'base64').toDER('hex');
        const publicKey = ec.keyFromPublic(this.from, 'hex');
        return publicKey.verify(this.computeHash(), signature);
    }
}
//运输信息类
class Delivery {
    constructor(from,to,date,operator) {
        this.from = from;               //发出地
        this.to = to;                   //发往地
        this.date = date;               //发出时间
        this.operator = operator;       //操作员
    }

    getFrom() {
        return this.from;
    }
    setFrom(from) {
        this.from = from;
    }
    getTo() {
        return this.to;
    }
    setTo(to) {
        this.to = to;
    }
    getDate() {
        return this.date;
    }
    setDate(date) {
        this.date =date;
    }
    getOperator() {
        return this.operator;
    }
    setOperator(operator) {
        this.operator = operator;
    }

    computeHash(){
        return sha256(
            this.from +
            this.to +
            this.date +
            this.operator
        ).toString();
    }

    // 签名需要private key
    sign(privateKey){
        // 验证你拥有这笔钱。privateKey和fromAddress对应的上
        this.signature =  privateKey.sign(this.computeHash(), 'base64').toDER('hex')
    }
    //验证运输信息合法性
    isValid(){
        // from Address 就是public key
        // 有两种类型的 transaction

        if(!this.signature){
            // throw new Error('sig missing');
            console.log('signature missing');
        }

        const publicKey = ec.keyFromPublic(this.from, 'hex')
        return publicKey.verify(this.computeHash(), this.signature)
    }
    //验证运输信息修改权限
    verify(privateKey) {
        const signature = privateKey.sign(this.computeHash(),'base64').toDER('hex');
        const publicKey = ec.keyFromPublic(this.from, 'hex');
        return publicKey.verify(this.computeHash(), signature);
    }
}
//订单区块
class OrderBlock {
    constructor(order) {
        this.order = order;                 //订单
        this.state = 'Pending';             //订单状态
        this.timestamp = Date.now();        //订单生效时间
        this.nonce = 1;
        this.hash = this.computeHash();     //哈希值
        this.lock = false;                  //订单状态
    }

    getOrder() {
        return this.order;
    }
    setOrder(order) {
        if(!this.lock){
            this.order =order;
            this.hash =this.computeHash()
        }
        else{
            // throw new Error('order information locked.');
            console.log('order information locked.');
        }
    }

    getState() {
        return this.state;
    }
    setState(state) {
        this.state = state;
        this.hash = this.computeHash();
    }
    lockOrder() {
        this.lock = true;
        this.hash = this.computeHash();
    }

    computeHash() {
        // data 需要 stringify
        // JSON.stringify
        return sha256(
            JSON.stringify(this.order) +
            this.state +
            this.nonce +
            this.timestamp +
            this.lock
        ).toString();
    }

    //在block里验证这所有的Order
    validateOrder(){
        if(!this.order.isValid()){
            console.log('订单异常');
            return false;
        }
        return true;
    }
}

//运输区块类
class TraceBlock {
    constructor(delivery,previousHash) {
        this.delivery = delivery;           //运输信息
        this.previousHash = previousHash;   //前一个区块的哈希值
        this.state = 'Shipping';            //运输状态
        this.timestamp = Date.now();        //时间戳
        this.nonce = 1;
        this.hash = this.computeHash();     //哈希值
        this.lock = false;                  //运输区块状态
    }

    getDelivery() {
        return this.delivery;
    }
    setDelivery(delivery) {
        if(!this.lock){
            this.delivery =delivery;
            this.hash =this.computeHash()
        }
        else{
            // throw new Error('Delivery information locked.');
            console.log('Delivery information locked.');
        }

    }
    getState() {
        return this.state;
    }

    setState(state) {
        this.state = state;
    }

    lockBlock() {
        this.lock = true;
    }
    getLock() {
        return this.lock;
    }
    computeHash() {
        // data 需要 stringify
        // JSON.stringify
        return sha256(
            JSON.stringify(this.delivery) +
            this.previousHash +
            this.nonce +
            this.timestamp
        ).toString();
    }

    //在block里验证这所有的delivery
    validateDelivery(){
        if(!this.delivery.isValid()){
            console.log('货物运送异常')
            return false
        }
        return true

    }
}
//运输链类
class DeliveryChain {
    constructor(order,owner) {
        this.orderBlock =new OrderBlock(order);     //订单区块
        if(this.orderBlock.validateOrder()){        //验证区块合法性
            this.orderBlock.lockOrder();            //锁定订单区块
        }
        else{
            this.close =true;
            // throw new Error('运输链创建失败。')
            console.log('运输链创建失败。');
        }
        this.owner = owner;
        this.chain = [];
        this.close = false;
        // this.chain = [this.bigBang(order)];
    }

    //验证用户权限获取订单
    getOrder(privateKey) {
        if(this.verify(privateKey)){
            return this.orderBlock.getOrder();
        }
        else if(this.orderBlock.getOrder().verify(privateKey)) {
            return this.orderBlock.getOrder();
        }
        else{
            // throw new Error('没有权限查看订单信息。');
            console.log('没有权限查看订单信息。');
        }
    }
    //验证用户权限修改订单
    setOrder(order,privateKey) {
        if(this.orderBlock.getOrder().verify(privateKey) && this.chain.length === 0) {
            this.orderBlock.setOrder(order);
        }
        else{
            // throw new Error('没有权限修改订单信息。');
            console.log('没有权限修改订单信息。');
        }

    }
    //获取当前运输状态
    getState() {
        if(this.chain.length === 0 && this.orderBlock){
            return this.orderBlock.getState();
        }
        return this.getLatestBlock().getState();
    }
    //买家确认收货，结束交易
    closeChain(privateKey) {
        if(this.verify(privateKey)){
            if (this.getLatestBlock().getDelivery().getTo() === this.getOrder(privateKey).getTo()) {
                this.getLatestBlock().setState('Received');
                this.close = true;
                this.hash = this.computeHash();
            }
        }
        else {
            // throw new Error('没有权限签收。');
            console.log('没有权限签收。');
        }
    }
    //添加新的运输区块到运输链上
    addBlock(delivery,privateKey) {
        //判断运输链是否关闭
        if(this.close === true){
            // throw new Error('Delivery Chain is Closed.');
            console.log('Delivery Chain is Closed.');
        }
        //判断运输信息是否齐全
        if(!delivery.getFrom() || !delivery.getTo() || !delivery.getDate() || !delivery.getOperator()){
            // throw new Error('Incomplete delivery information.');
            console.log('Incomplete delivery information.');
        }
        //验证运输信息是否合法
        if(!delivery.isValid()){
            // throw new Error('Invalid delivery.');
            console.log('Invalid delivery.');
        }
        //验证运输地点是否匹配
        if(this.chain.length === 0 && this.getOrder(privateKey).getFrom() !== delivery.getFrom()){
            // throw new Error('The original place is not matched.');
            console.log('The original place is not matched.');
        }
        if(this.chain.length > 0 && this.getLatestBlock().getDelivery().getTo() !== delivery.getFrom()){
            // throw new Error('The from place is not matched.');
            console.log('The from place is not matched.');
        }
        //已存在运输信息
        if(this.chain.length !== 0){
            this.getLatestBlock().lockBlock();
            const newBlock = new TraceBlock(delivery,this.getLatestBlock().hash);
            // newBlock.lockBlock();
            this.chain.push(newBlock);
            // this.setState();
        }
        //暂无运输信息
        else{
            const newBlock = new TraceBlock(delivery,this.getOrderBlock().hash);
            // newBlock.lockBlock();
            this.chain.push(newBlock);
            // this.setState();
        }
    }
    //获取最新的运输区块
    getLatestBlock() {
        if(this.chain.length === 0){
            // throw new Error('NO delivery information yet.');
            console.log('NO delivery information yet.');
        }
        return this.chain[this.chain.length - 1];
    }
    //获取订单区块
    getOrderBlock() {
        return this.orderBlock;
    }
    //设置链上的最后一个运输区块的运输信息
    setDelivery(delivery,privateKey) {
        if(this.getLatestBlock().getDelivery().verify(privateKey)) {
            if(this.getLatestBlock().getDelivery().getFrom() === delivery.getFrom()){
                this.getLatestBlock().setDelivery(delivery);
            }
            else {
                // throw new Error("Can't change the from place.");
                console.log("Can't change the from place.");
            }

        }
        else{
            // throw new Error('没有权限修改该节点运输信息。');
            console.log('没有权限修改该节点运输信息。');
        }
    }

    computeHash(){
        return sha256(
            JSON.stringify(this.orderBlock) +
            this.owner +
            this.close
        ).toString();
    }

    // 签名需要private key
    sign(privateKey){
        this.signature =  privateKey.sign(this.computeHash(), 'base64').toDER('hex');
    }
    //验证权限，需要private key
    verify(privateKey){
        if(!this.signature){
            // throw new Error('sig missing');
            console.log('signature missing');
        }
        const signature = privateKey.sign(this.computeHash(),'base64').toDER('hex');
        const publicKey = ec.keyFromPublic(this.owner, 'hex');
        return publicKey.verify(this.computeHash(), signature);
    }


    //验证这个当前的区块链是否合法
    //当前的数据有没有被篡改
    //验证区块的previousHash是否等于previous区块的hash

    // validate all the deliveries
    validateChain() {
        if (!this.orderBlock.validateOrder()){
            return false;
        }
        if (this.chain.length === 0) {
            return true;
        }
        //验证第一个运输区块和订单区块的连接
        if (this.chain.length === 1) {
            const blockToValidate = this.chain[0];
            // block的transactions均valid
            if (!blockToValidate.validateDelivery()){
                console.log('货物运送异常')
                return false
            }
            //当前的数据有没有被篡改
            if (blockToValidate.hash !== blockToValidate.computeHash()) {
                console.log("数据篡改");
                return false;
            }
            console.log(this.chain)
            //我们要验证区块的previousHash是否等于previous区块的hash
            const previousBlock = this.getOrderBlock();
            if (blockToValidate.previousHash !== previousBlock.hash) {
                console.log("前后区块链接断裂");
                return false;
            }
        }
        // this.chain[1] 是第二个区块
        // 验证到最后一个区块 this.chain.length -1
        for (let i = 1; i <= this.chain.length - 1; i++) {
            const blockToValidate = this.chain[i];
            // block的transactions均valid
            if (!blockToValidate.validateDelivery()){
                console.log('货物运送异常')
                return false
            }
            //当前的数据有没有被篡改
            if (blockToValidate.hash !== blockToValidate.computeHash()) {
                console.log("数据篡改");
                return false;
            }
            console.log(this.chain)
            //验证区块的previousHash是否等于previous区块的hash
            const previousBlock = this.chain[i - 1];
            if (blockToValidate.previousHash !== previousBlock.hash) {
                console.log("前后区块链接断裂");
                return false;
            }
        }
        return true;
    }
}

module.exports = {DeliveryChain, TraceBlock, OrderBlock, Delivery, Order}