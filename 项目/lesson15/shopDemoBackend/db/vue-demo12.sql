
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `vue-demo12` /*!40100 DEFAULT CHARACTER SET utf8 */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `vue-demo12`;
DROP TABLE IF EXISTS `banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `banners` (
  `b_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `img` varchar(255) NOT NULL COMMENT '图片文件名(需和前端public/images中一致)',
  `title` varchar(100) DEFAULT NULL COMMENT '轮播图标题',
  `sort` int(11) DEFAULT '0' COMMENT '排序权重(数字越大越靠前)',
  `g_id` int(11) DEFAULT NULL COMMENT '关联的商品g_id',
  PRIMARY KEY (`b_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='首页轮播图表';
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `banners` WRITE;
/*!40000 ALTER TABLE `banners` DISABLE KEYS */;
INSERT INTO `banners` VALUES (1,'1.jpg','赛博朋克2077',10,1),(2,'2.jpg','反恐精英2',9,51),(3,'3.jpg','心灵杀手2',8,37);
/*!40000 ALTER TABLE `banners` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category` (
  `c_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '分类id',
  `c_name` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '分类名称',
  PRIMARY KEY (`c_id`) USING BTREE,
  UNIQUE KEY `c_name` (`c_name`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `category` WRITE;
/*!40000 ALTER TABLE `category` DISABLE KEYS */;
INSERT INTO `category` VALUES (1,'付费'),(2,'免费');
/*!40000 ALTER TABLE `category` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `goods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `goods` (
  `g_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '商品id',
  `goodsname` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '商品名称',
  `price` decimal(10,2) NOT NULL COMMENT '商品 价格',
  `img` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '商品图片',
  `c_id` int(11) NOT NULL COMMENT '分类id',
  `introduce` text,
  `stock` int(11) NOT NULL DEFAULT '0' COMMENT '库存',
  `is_sale` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否上架，0表示下架，1表示上架',
  `is_delete` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否删除，0表示删除，1表示未删除',
  PRIMARY KEY (`g_id`) USING BTREE,
  KEY `c_id` (`c_id`) USING BTREE,
  CONSTRAINT `goods_ibfk_1` FOREIGN KEY (`c_id`) REFERENCES `category` (`c_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=121 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `goods` WRITE;
/*!40000 ALTER TABLE `goods` DISABLE KEYS */;
INSERT INTO `goods` VALUES (1,'赛博朋克2077',298.00,'Cyberpunk_2077.jpg',1,'霓虹闪烁的未来夜之城，权力与肉体改造是永恒的主题。化身雇佣兵V，在开放世界的无尽抉择中，谱写属于你的赛博传奇。',902,1,1),(2,'Titanfall 2',158.00,'Taitanfall2.jpg',1,'体验人机合一的终极浪漫！化身反抗军铁驭，执掌前锋级泰坦BT-7274，在流畅的滑墙飞跃与密集的炮火中，开启震撼心灵的科幻史诗。',570,1,1),(3,'巫师 3: 狂猎',148.00,'Witcher_3_cover_art.jpg',1,'踏上文明边缘的荒野，化身白狼杰洛特。在战火纷飞、怪物肆虐的开放魔幻世界中，寻找预言之子，斩妖除魔，重塑世界的命运。',142,1,1),(4,'Devil May Cry 5',198.00,'Devil_May_Cry_5.jpg',1,'传奇恶魔猎人华丽回归！三大风格迥异的主角动作交织，在酷炫至极的SSS级连招与重金属摇滚激奏中，斩裂阻挡在前方的万千恶魔。',1,1,1),(5,'极限竞技: 地平线4',248.00,'FM4_Chinese_Cover.jpg',1,'驶入四季轮转的唯美英伦。收集、改装并驾驶数百辆世界顶级超跑，在动态天气与开放世界的狂欢节中，尽情释放你的速度与激情。',573,1,1),(6,'四海兄弟: 最终版',139.00,'Mafia_Definitive_Edition.jpg',1,'从底层出租车司机跌入禁酒令时期的黑帮漩涡。在极具电影质感的叙事中，体验背叛、权力与禁忌，重温枭雄初代的至暗崛起。',862,1,1),(7,'四海兄弟II 最终版',139.00,'Mafia_II_Boxart.jpg',1,'重返20世纪中叶的帝国湾。化身二战老兵维托，为了偿还父亲的债务铤而走险，在黄金时代的爵士乐与枪火中，用生命缔造黑帮法则。',591,1,1),(8,'消逝的光芒2: 重装上阵版',198.00,'Dying_Light_2_cover.jpg',1,'病毒肆虐后的最后一座人类城市。白天在这片破败的屋顶之上施展极限跑酷，夜晚在致命丧尸倾巢而出的修罗场中，竭尽全力活下去。',368,1,1),(9,'地铁: 离乡',148.00,'Metro_Exodus.jpg',1,'逃离死寂的莫斯科地下废墟。搭乘“曙光号”蒸汽机车，穿越核战后危机四伏的俄罗斯广袤废土，体验沉浸感拉满的末日求生之旅。',69,1,1),(10,'生化奇兵2',99.00,'BioShock 2.jpg',1,'重返深海之下的梦幻乌托邦“销魂城”。这一次你将化身最初的守护者大老爹（Big Daddy），在冰冷的海底废墟中寻找救赎与真相。',237,1,1),(11,'地铁: 最后的曙光 重制版',79.00,'Metro Last Light.jpg',1,'在莫斯科冰封的地铁隧道深处，残存的人类正陷入永无止境的内战。面对变异生物与致命辐射，守护人类文明最后的一缕曙光。',977,1,1),(12,'女神异闻录5 皇家版',329.00,'Persona_5_cover.jpg',1,'告别死板生活，化身心之怪盗团团长！白天是平凡的高中生，夜晚潜入腐败大人的潜意识殿堂。夺取恶人心灵，让全社会为你改邪归正！',174,1,1),(13,'艾尔登法环',298.00,'header.jpg',1,'《艾尔登法环》故事发生在名为“交界地”的地区。艾尔登法环破碎后，其碎片“大卢恩”散落各地。“永恒女王”玛莉卡失去踪迹，“黄金”葛德文在“黑刀之夜”成为最初的死者。玛莉卡的后代众半神们取得法环碎片，碎片带来的力量使他们陷入疯狂，引发“破碎战争”，此战没有王者崛起，却导致“无上意志”的抛弃。玩家作为褪色者[注 1]，目标是修复艾尔登法环，成为艾尔登之王。',940,1,1),(14,'刺客信条:起源',248.00,'592450934e0165f46c8b4568.webp',1,'游戏的舞台是在托勒密王朝及埃及艳后统治下的古埃及，玩家所操控的角色是一位隶属于法老的护卫，称为守护者（Medjai），来自锡瓦（Siwa）名为巴耶克（Bayek）的埃及刺客。',176,1,1),(15,'饥荒',48.00,'Don\'t Starve.jpg',1,'游戏围绕着一位名叫威尔逊的科学家展开：他发现自己身处黑暗的世界，必须尽可能长时间生存。为此，玩家必须保持威尔逊的健康、食物和精神稳定以避免被各种超现实的敌人杀死或吞噬。',58,1,1),(16,'荒野大镖客：救赎2',298.00,'rdr2.jpg',1,'以美国西部时代为背景，体验极具沉浸感的开放世界冒险旅程',765,1,1),(17,'博德之门3',298.00,'bg3.jpg',1,'基于龙与地下城规则打造，拥有极高自由度的角色扮演体验',650,1,1),(18,'霍格沃茨之遗',248.00,'hogwarts.jpg',1,'进入魔法学院学习法术，在开放世界中展开奇幻冒险',952,1,1),(19,'死亡搁浅导演剪辑版',198.00,'death_stranding.jpg',1,'连接破碎的人类社会，在末世世界中完成重要使命',811,1,1),(20,'怪物猎人：世界',148.00,'mhw.jpg',1,'探索广阔生态环境，挑战强大怪物并打造顶级装备',199,1,1),(21,'怪物猎人：崛起',198.00,'mhr.jpg',1,'利用翔虫与御龙系统进行高速战斗和怪物狩猎体验',561,1,1),(22,'只狼：影逝二度',268.00,'sekiro.jpg',1,'化身独臂忍者踏上复仇之路，挑战极具难度的敌人',210,1,1),(23,'黑暗之魂3',198.00,'ds3.jpg',1,'探索衰败王国与神秘遗迹，体验经典魂系战斗机制',363,1,1),(24,'艾尔登法环：黄金树幽影',328.00,'eldendlc.jpg',1,'前往全新地图探索未知秘密，挑战更强大的首领敌人',185,1,1),(25,'生化危机2重制版',138.00,'re2.jpg',1,'浣熊市爆发病毒危机，在恐怖环境中努力求得生存',834,1,1),(26,'生化危机4重制版',248.00,'re4.jpg',1,'执行营救任务深入危险村庄，对抗神秘寄生组织势力',619,1,1),(27,'生化危机8：村庄',198.00,'re8.jpg',1,'寻找失踪女儿的过程中，逐步揭开村庄背后的秘密',589,1,1),(28,'地平线：零之曙光',198.00,'hzd.jpg',1,'在人类文明衰落后的未来世界中探索自身身世真相',89,1,1),(29,'地平线：西之绝境',298.00,'hfw.jpg',1,'踏上未知大陆展开冒险，发现更多机械生物与遗迹',681,1,1),(30,'战神',198.00,'gow.jpg',1,'奎托斯带领儿子踏上旅途，面对北欧诸神与命运挑战',135,1,1),(31,'战神：诸神黄昏',348.00,'gowr.jpg',1,'诸神黄昏即将降临，迎接众神与巨人的终极决战',633,1,1),(32,'漫威蜘蛛侠重制版',248.00,'spiderman.jpg',1,'化身蜘蛛侠守护纽约城市，自由穿梭高楼之间战斗',760,1,1),(33,'漫威蜘蛛侠：迈尔斯',198.00,'miles.jpg',1,'年轻英雄迈尔斯逐渐成长，肩负起守护城市的责任',904,1,1),(34,'最后生还者Part1',298.00,'tlou1.jpg',1,'末日灾难席卷世界，踏上充满危险与希望的旅程',236,1,1),(35,'控制终极版',138.00,'control.jpg',1,'调查神秘机构中的超自然事件，掌握强大异能作战',472,1,1),(36,'量子破碎',118.00,'quantum.jpg',1,'利用时间操控能力对抗敌人，体验电影式剧情演出',647,1,1),(37,'心灵杀手2',248.00,'alanwake2.jpg',1,'深入黑暗超自然事件之中，揭开隐藏多年的谜团',819,1,1),(38,'文明6',99.00,'civ6.jpg',1,'从远古时代发展文明，带领国家走向世界巅峰',156,1,1),(39,'全面战争：战锤3',268.00,'warhammer3.jpg',1,'结合即时战斗与回合策略，体验史诗级战争场面',322,1,1),(40,'钢铁雄心4',148.00,'hoi4.jpg',1,'以二战历史为背景，制定战略并改变世界格局',141,1,1),(41,'欧陆风云4',138.00,'eu4.jpg',1,'经营国家发展外交军事力量，书写全新历史篇章',742,1,1),(42,'群星',158.00,'stellaris.jpg',1,'建立属于自己的星际文明，探索浩瀚未知宇宙空间',283,1,1),(43,'城市：天际线',118.00,'cities.jpg',1,'规划交通与公共设施，打造理想中的现代化都市',188,1,1),(44,'模拟人生4',99.00,'sims4.jpg',1,'自由创造角色人生，体验丰富多彩的日常生活',92,1,1),(45,'极限竞速：地平线5',248.00,'fh5.jpg',1,'驾驶数百辆豪车驰骋墨西哥，享受开放世界竞速',894,1,1),(46,'极品飞车：热度',158.00,'nfsheat.jpg',1,'白天参加正规赛事，夜晚展开刺激街头竞速挑战',194,1,1),(47,'尘埃5',128.00,'dirt5.jpg',1,'驾驶越野赛车征服复杂赛道，感受极限驾驶乐趣',288,1,1),(48,'F1 24',248.00,'f124.jpg',1,'体验一级方程式赛车竞技，挑战全球顶尖车手',856,1,1),(49,'NBA 2K25',298.00,'nba2k25.jpg',1,'体验真实篮球竞技赛事，打造属于自己的传奇生涯',418,1,1),(50,'EA SPORTS FC 25',298.00,'fc25.jpg',1,'操控世界知名球队参赛，感受真实足球竞技魅力',519,1,1),(51,'反恐精英2',0.00,'cs2.jpg',2,'CT VS T',341,1,1),(52,'Apex英雄',0.00,'Apex_Legends_Cover.jpg',2,'战术竞技巅峰之作，独特英雄技能结合流畅滑铲激战。',150,1,1),(53,'军团要塞2',0.00,'tf2.jpg',2,'经典多职业阵营射击游戏，风格诙谐且极具战术深度。',724,1,1),(54,'命运2',0.00,'destiny2.jpg',2,'第一人称宇宙科幻射击，震撼的Raid副本与绝佳射击手感。',172,1,1),(55,'战意',0.00,'conquerors_blade.jpg',2,'古代冷兵器战术网游，指挥兵团亲自登临战场万人攻城。',687,1,1),(56,'行星边际2',0.00,'planetside2.jpg',2,'千人同屏的宏大科幻战争，跨阵营陆空立体全线冲突。',916,1,1),(57,'枪火游侠',0.00,'paladins.jpg',2,'奇幻风格团队战术射击游戏，丰富的卡牌搭配改变技能。',520,1,1),(59,'第一后裔',0.00,'the_first_descendant.jpg',2,'虚幻5打造的高画质第三人称刷宝射击，合作对抗巨型BOSS。',850,1,1),(61,'DOTA2',0.00,'dota2.jpg',2,'硬核战术竞技天花板，全英雄免费，极具深度的策略深度。',692,1,1),(62,'永劫无间 (免费版)',0.00,'naraka.jpg',2,'东方武侠动作博弈，飞索飞檐走壁，享受畅快的冷兵器拼刀。',911,1,1),(63,'神之浩劫',0.00,'smite.jpg',2,'3D第三人称视角的众神乱斗MOBA，动作感与激战体验拉满。',475,1,1),(66,'星际战甲 (Warframe)',0.00,'warframe.jpg',2,'太空忍者炫酷动作刷宝，“肝”度爆表，极其丰富的战甲武器。',641,1,1),(67,'流放之路',0.00,'poe.jpg',2,'暗黑风硬核ARPG神作，数万种天赋搭配，赛季玩法丰富。',782,1,1),(68,'Unturned',0.00,'unturned.jpg',2,'像素风丧尸生存神作，搜刮资源、建造基地、防范玩家。',984,1,1),(69,'星战前夜：晨曦 (EVE Online)',0.00,'eve.jpg',2,'硬核星战沙盒沙盘，万名玩家共享真实宇宙经济与主权战争。',574,1,1),(70,'失落的方舟',0.00,'lost_ark.jpg',2,'俯视角MMORPG巨作，极致震撼的动作打击感与副本机制。',920,1,1),(71,'异尘余生：庇护所',0.00,'fallout_shelter.jpg',2,'辐射IP模拟经营，管理地下避难所，抵御废土危机。',875,1,1),(75,'战争雷霆',0.00,'warthunder.jpg',2,'海陆空三栖硬核载具射击，硬核受损模型，还原真实战场。',616,1,1),(80,'游戏王：大师决斗',0.00,'yugioh_md.jpg',2,'经典游戏王卡牌终极数字化版本，还原最硬核的主流构筑。',456,1,1),(81,'昆特牌：巫师卡牌游戏',0.00,'gwent.jpg',2,'源自《巫师3》的独特卡牌博弈，三局两胜，田忌赛马的谋略。',431,1,1),(82,'暗影诗章',0.00,'shadowverse.jpg',2,'华丽日系二次元卡牌CCG，独特的进化机制掌控战场。',784,1,1),(85,'微型机甲 (GigaBash)',0.00,'gigabash.jpg',2,'化身巨型怪兽或超级机甲，在可破坏城市中大打出手。',627,1,1),(89,'跑跑卡丁车：漂移',0.00,'ppkdc.jpg',2,'经典IP全面高清重制，全平台互通，纯粹的漂移竞速。',784,1,1),(90,'求生之路2 (特惠体验周版)',0.00,'l4d2_free.jpg',2,'经典的四人合作对抗丧尸，Steam装机必备的联机神作。',36,1,1),(91,'世纪之石：竞技场',0.00,'rock_of_ages_arena.jpg',2,'脑洞大开的历史艺术风巨石滚滚撞击防御塔。',830,1,1),(92,'死亡细胞：先导免费版',0.00,'dead_cells_free.jpg',2,'体验横版肉鸽动作天花板的初始部分，感受无缝流畅连招。',42,1,1),(93,'第一圣堂骑士：序章',0.00,'first_templar.jpg',2,'动作冒险，扮演圣堂骑士揭开圣杯背后的惊天阴谋。',721,1,1),(94,'潜水员戴夫：抢先体验包',0.00,'dave_free.jpg',2,'白天捕鱼晚上开寿司店，现象级休闲独立游戏的免费版本。',476,1,1),(95,'星露谷物语：联机体验包',0.00,'stardew_free.jpg',2,'经典田园牧歌模拟经营，与好友一同下地干农活。',215,1,1);
/*!40000 ALTER TABLE `goods` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `order_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_details` (
  `details_id` int(10) NOT NULL AUTO_INCREMENT COMMENT '订单详情id',
  `order_id` int(10) NOT NULL COMMENT '订单id',
  `g_id` int(10) NOT NULL COMMENT '商品id',
  `num` int(10) NOT NULL COMMENT '商品数量',
  PRIMARY KEY (`details_id`) USING BTREE,
  KEY `fk_details_order` (`order_id`) USING BTREE,
  KEY `fk_details_goods` (`g_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=75 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `order_details` WRITE;
/*!40000 ALTER TABLE `order_details` DISABLE KEYS */;
INSERT INTO `order_details` VALUES (1,1,1,2),(2,1,2,1),(3,2,7,1),(4,3,4,1),(5,4,8,2),(6,4,1,1),(7,4,35,1),(8,5,6,1),(9,5,7,1),(10,6,3,1),(11,6,1,1),(12,6,28,1),(13,6,8,1),(14,6,30,1),(15,7,2,1),(16,7,15,1),(17,7,1,2),(18,8,2,1),(19,8,32,1),(20,8,3,1),(21,8,1,1),(22,9,40,1),(23,9,34,1),(24,9,37,1),(25,10,2,1),(26,10,1,1),(27,10,31,1),(28,10,25,1);
/*!40000 ALTER TABLE `order_details` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `order_id` int(10) NOT NULL AUTO_INCREMENT COMMENT '订单id',
  `u_id` int(5) NOT NULL COMMENT '用户id',
  `recipient` varchar(20) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '收货人',
  `address` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '收货地址',
  `phone` char(11) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '收货电话',
  `totalprice` decimal(8,2) NOT NULL COMMENT '订单总价',
  `orderDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '订单时间，默认系统当前时间',
  `status` enum('0','1') CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '0' COMMENT '订单状态 ，0表示未发货，1表示已发货',
  `is_delete` enum('1','0') CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '1' COMMENT '是否删除，1表示未删除，0表示删除',
  PRIMARY KEY (`order_id`) USING BTREE,
  KEY `fk_order_user` (`u_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=118 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,1,'演示用户1','虚构地址（仅供测试）','13900000000',49.97,'2025-05-18 17:33:08','0','1'),(2,6,'演示用户2','虚构地址（仅供测试）','13900000000',59.00,'2026-06-15 08:49:55','0','0'),(3,6,'演示用户3','虚构地址（仅供测试）','13900000000',18.00,'2026-06-15 09:32:54','0','0'),(4,6,'演示用户4','虚构地址（仅供测试）','13900000000',832.00,'2026-06-16 16:54:24','0','0'),(5,6,'演示用户5','虚构地址（仅供测试）','13900000000',278.00,'2026-06-17 10:40:36','0','0'),(6,8,'演示用户6','虚构地址（仅供测试）','13900000000',1040.00,'2026-06-22 10:53:49','0','0'),(7,6,'演示用户7','虚构地址（仅供测试）','13900000000',802.00,'2026-06-26 14:55:03','0','0'),(8,9,'演示用户8','虚构地址（仅供测试）','13900000000',852.00,'2026-07-01 20:15:22','0','1'),(9,8,'演示用户9','虚构地址（仅供测试）','13900000000',694.00,'2026-07-02 15:33:10','0','1'),(10,8,'演示用户10','虚构地址（仅供测试）','13900000000',942.00,'2026-07-02 15:56:50','0','0');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `shopcart`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shopcart` (
  `cart_id` int(10) NOT NULL AUTO_INCREMENT COMMENT '购物车id',
  `u_id` int(5) NOT NULL COMMENT '用户id',
  `g_id` int(10) NOT NULL COMMENT '商品id',
  `num` int(10) NOT NULL COMMENT '商品数量',
  PRIMARY KEY (`cart_id`) USING BTREE,
  KEY `fk_cart_user` (`u_id`) USING BTREE,
  KEY `fk_cart_goods` (`g_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `shopcart` WRITE;
/*!40000 ALTER TABLE `shopcart` DISABLE KEYS */;
INSERT INTO `shopcart` VALUES (3,1,7,1),(4,1,14,5),(39,8,3,1),(40,8,2,1);
/*!40000 ALTER TABLE `shopcart` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `u_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '用户id',
  `username` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '用户名',
  `password` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '密码',
  `phone` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '电话',
  `status` enum('0','1') CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '1' COMMENT '用户状态，0表示冻结，1表示正常',
  `role` enum('0','1') CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '0' COMMENT '角色：0表示普通用户，1表示管理员',
  PRIMARY KEY (`u_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (6,'7878','$2b$10$6DzdnC8GW8UMpy4UwP6INOQZ39wqoj0AVn41vz75RZMSprsCRj9Da','13900000006','1','0'),(8,'admin','$2b$10$xnFfrre7iZ5jnKOlFjGHk./J9OnuXg2GvZ3Sws4hvCcjlXSaoa3rC','13900000008','1','1'),(9,'Twistzz','$2b$10$4LJvzzhO44Cvt4ShiWdDHO/4erbcbRv/yiglT5oXbdGliwUS/ZG6a','13900000009','1','0');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;


-- 数据一致性升级（初始化数据导入完成后执行）
ALTER TABLE goods ADD COLUMN version INT UNSIGNED NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN request_key VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL;
ALTER TABLE orders ADD COLUMN request_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL;
ALTER TABLE order_details ADD COLUMN unit_price DECIMAL(10,2) NULL;
ALTER TABLE order_details ADD COLUMN goodsname_snapshot VARCHAR(255) NULL;
ALTER TABLE order_details ADD COLUMN img_snapshot VARCHAR(255) NULL;
ALTER TABLE users ADD UNIQUE KEY uq_users_username (username), ADD UNIQUE KEY uq_users_phone (phone);
ALTER TABLE orders ADD UNIQUE KEY uq_orders_request (u_id, request_key);
DROP TABLE IF EXISTS user_games;
CREATE TABLE IF NOT EXISTS user_games (
    u_id INT NOT NULL,
    g_id INT NOT NULL,
    goodsname_snapshot VARCHAR(255) NOT NULL,
    img_snapshot VARCHAR(255) NULL,
    claimed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (u_id, g_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
UPDATE order_details d LEFT JOIN goods g ON g.g_id=d.g_id SET d.goodsname_snapshot=COALESCE(g.goodsname, '历史商品'), d.img_snapshot=g.img WHERE d.goodsname_snapshot IS NULL;

ALTER TABLE users ADD COLUMN auth_version INT UNSIGNED NOT NULL DEFAULT 0;
