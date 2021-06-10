const ecLib = require('elliptic').ec;
const ec = new ecLib('secp256k1') // curve name
// 如果作为依赖安装，请用这种方式import

const { DeliveryChain, TraceBlock, OrderBlock, Delivery, Order } = require("./DeliveryChain");
//卖家密钥对
const seller = ec.genKeyPair();
const privateKeySeller = seller.getPrivate('hex');
const publicKeySeller = seller.getPublic('hex');
//买家密钥对
const buyer = ec.genKeyPair();
const privateKeyBuyer =buyer.getPrivate('hex');
const pubilicKeyBuyer = buyer.getPublic('hex')
//第一个运输节点
const logistics_1 = ec.genKeyPair();
const privateKeyLogistics_1 = logistics_1.getPrivate('hex');
const publicKeyLogistics_1 = logistics_1.getPublic('hex');
//第二个运输节点
const logistics_2 = ec.genKeyPair();
const privateKeyLogistics_2 = logistics_2.getPrivate('hex');
const publicKeyLogistics_2 = logistics_2.getPublic('hex');
//第三个运输节点
// const logistics_3 = ec.genKeyPair();
// const privateKeyLogistics_3 = logistics_3.getPrivate('hex');
// const publicKeyLogistics_3 = logistics_3.getPublic('hex');

//创建订单，卖家对订单签名认证
const order1 = new Order('milk','1kg','20',publicKeySeller,pubilicKeyBuyer);
order1.sign(ec.keyFromPrivate(privateKeySeller));
// console.log(order1);
//创建运输链，买家对运输链签名认证
const deliveryChain = new DeliveryChain(order1,pubilicKeyBuyer);
deliveryChain.sign(ec.keyFromPrivate(privateKeyBuyer))
// console.log(deliveryChain);

//创建订单生成运输链之后，货物处于Pending（待发货）状态
// console.log(deliveryChain.getState())
// console.log(deliveryChain.isValid(ec.keyFromPrivate(privateKeySeller)));
//仅有卖家和买家可以通过验证，获取订单详情
// console.log(deliveryChain.getOrder(ec.keyFromPrivate(privateKeyBuyer)));
// console.log(deliveryChain.getOrder(ec.keyFromPrivate(privateKeySeller)));
// console.log(deliveryChain.getOrder(ec.keyFromPrivate(privateKeyLogistics_1)));

//运输到第一个节点
const delivery1 = new Delivery(publicKeySeller,publicKeyLogistics_1,'2021-06-08',516);
// const delivery1 = new Delivery(publicKeySeller,publicKeyLogistics_1,'2021-06-08',1123);
delivery1.sign(ec.keyFromPrivate(privateKeySeller));
deliveryChain.addBlock(delivery1,ec.keyFromPrivate(privateKeySeller));
// console.log(deliveryChain);
//将TraceBlock加入运输链，货物处于Shipping（运输）状态
// console.log(deliveryChain.getState())

//运输到第二个节点
const delivery2 = new Delivery(publicKeyLogistics_1,publicKeyLogistics_2,'2021-06-09',714);
delivery2.sign(ec.keyFromPrivate(privateKeyLogistics_1));
deliveryChain.addBlock(delivery2,ec.keyFromPrivate(privateKeyLogistics_1));
// console.log(deliveryChain);

//验证来源地点匹配
// const delivery2 = new Delivery(publicKeyLogistics_2,pubilicKeyBuyer,'2021-06-09',113);
// delivery2.sign(ec.keyFromPrivate(privateKeyLogistics_2));
// deliveryChain.addBlock(delivery2);
// console.log(deliveryChain);


//运输到买家手中
const delivery3 = new Delivery(publicKeyLogistics_2,pubilicKeyBuyer,'2021-06-10',125)
delivery3.sign(ec.keyFromPrivate(privateKeyLogistics_2));
deliveryChain.addBlock(delivery3,ec.keyFromPrivate(privateKeyLogistics_2));
// console.log(deliveryChain.chain[2]);

// 可修改最后一个加在运输链上的运输信息
// const delivery4 = new Delivery(publicKeyLogistics_2,pubilicKeyBuyer,'2021-06-11',1229);
// deliveryChain.setDelivery(delivery4,ec.keyFromPrivate(privateKeyLogistics_2))
// console.log(deliveryChain.chain[2]);

//验证运输链的合法性
// console.log(deliveryChain.validateChain());
//修改订单
// const order2 = new Order('juice','0.5kg','30',publicKeySeller,pubilicKeyBuyer);
// order2.sign(ec.keyFromPrivate(privateKeySeller));
// deliveryChain.getOrderBlock().setOrder(order2)
// console.log(deliveryChain.getOrderBlock())
//篡改属性名
// deliveryChain.getOrderBlock().getOrder().setName('juice');
// console.log(deliveryChain.validateChain());
//篡改运输信息
// deliveryChain.chain[1].getDelivery().setFrom(publicKeyLogistics_2);
// console.log(deliveryChain.validateChain());

// 买家收货
deliveryChain.closeChain(ec.keyFromPrivate(privateKeyBuyer))
// console.log(deliveryChain.getState())
console.log(deliveryChain);
