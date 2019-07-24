function destroyLeaves(x, y, z){
	var max = 0;
	while(World.getBlockID(x, y+max+1, z)==BlockID.rubberTreeLeaves){max++;}
	for(var yy = y; yy <= y+max; yy++){
		for(var xx = x-2; xx <= x+2; xx++){
			for(var zz = z-2; zz <= z+2; zz++){
				if(World.getBlockID(xx, yy, zz)==BlockID.rubberTreeLeaves){
					if(Math.random() < .075){
						World.drop(xx, yy, zz, ItemID.rubberSapling, 1, 0);
					}
					World.setBlock(xx, yy, zz, 0);
				}
			}
		}
	}
}

IDRegistry.genBlockID("rubberTreeLog");
Block.createBlock("rubberTreeLog", [
	{name: "Rubber Tree Log", texture: [["rubber_wood", 1], ["rubber_wood", 1], ["rubber_wood", 0], ["rubber_wood", 0], ["rubber_wood", 0], ["rubber_wood", 0]], inCreative: true}
], "opaque");
Block.registerDropFunction("rubberTreeLog", function(coords, blockID){
	destroyLeaves(coords.x, coords.y, coords.z);
	return [[blockID, 1, 0]];
});
Block.setDestroyTime(BlockID.rubberTreeLog, 0.4);
ToolAPI.registerBlockMaterial(BlockID.rubberTreeLog, "wood");

IDRegistry.genBlockID("rubberTreeLogLatex");
Block.createBlockWithRotation("rubberTreeLogLatex", [
	{name: "tile.rubberTreeLog.name", texture: [["rubber_wood", 1], ["rubber_wood", 1], ["rubber_wood_with_latex", 0], ["rubber_wood", 0], ["rubber_wood", 0], ["rubber_wood", 0]], inCreative: false},
	{name: "tile.rubberTreeLogLatex.name", texture: [["rubber_wood", 1], ["rubber_wood", 1], ["rubber_wood_with_latex", 1], ["rubber_wood", 0], ["rubber_wood", 0], ["rubber_wood", 0]], inCreative: false},
], "opaque");
Block.registerDropFunction("rubberTreeLogLatex", function(coords, blockID){
	destroyLeaves(coords.x, coords.y, coords.z);
	return [[BlockID.rubberTreeLog, 1, 0], [ItemID.latex, 1, 0]];
});
Block.setDestroyTime(BlockID.rubberTreeLogLatex, 0.4);
ToolAPI.registerBlockMaterial(BlockID.rubberTreeLogLatex, "wood");
Block.setRandomTickCallback(BlockID.rubberTreeLogLatex, function(x, y, z, id, data){
	if(data < 4 && Math.random() < 0.1){
		World.setBlock(x, y, z, id, data + 4);
	}
});


IDRegistry.genBlockID("rubberTreeLeaves");
Block.createBlock("rubberTreeLeaves", [
	{name: "Rubber Tree Leaves", texture: [["rubber_tree_leaves", 0]], inCreative: false}
]);
Block.registerDropFunction("rubberTreeLeaves", function(){
	if(Math.random() < .05){
		return [[ItemID.rubberSapling, 1, 0]]
	}
	else {
		return [];
	}
});
Block.setDestroyTime(BlockID.rubberTreeLeaves, 0.2);
ToolAPI.registerBlockMaterial(BlockID.rubberTreeLeaves, "plant");

Recipes.addShapeless({id: 5, count: 3, data: 3}, [{id: BlockID.rubberTreeLog, data: -1}]);



var RubberTreeGenerationHelper = {
	/*
	 params: {
		 leaves: {
			 id: 
			 data: 
		 },
		 log: {
			 id: 
			 data:
			 resin: 
		 },
		 height: {
			 min:
			 max:
			 start: 
		 },
		 pike:
		 radius: 
	 }
	*/
	generateCustomTree: function(x, y, z, params){
		var leaves = params.leaves;
		var log = params.log;
		
		var height = parseInt(Math.random() * (0.5 + params.height.max - params.height.min) + params.height.min);
		var k = 0.25;
		for(var ys = 0; ys < height; ys++){
			if(log.resin && Math.random() < k){
				World.setBlock(x, y + ys, z, log.resin, parseInt(Math.random()*4) + 4);
				k -= 0.1;
			}
			else{
				World.setFullBlock(x, y + ys, z, log);
			}
		}
		if(params.pike){
			for(var ys = 0; ys < params.pike; ys++){
				World.setFullBlock(x, y + ys + height, z, leaves);
			}
		}
		
		var leavesStart = params.height.start;
		var leavesEnd = height;
		var leavesMiddle = (leavesEnd + leavesStart) / 2;
		var leavesLen = leavesEnd - leavesStart;
		for(var ys = leavesStart; ys < leavesEnd; ys++){
			for(var xs = -params.radius; xs <= params.radius; xs++){
				for(var zs = -params.radius; zs <= params.radius; zs++){
					var d = Math.sqrt(xs*xs + zs*zs) + (Math.random()*0.5 + 0.5) * Math.pow(Math.abs(leavesMiddle - ys) / leavesLen, 1.5) * 1.2;
					var blockID = World.getBlockID(x + xs, y + ys, z + zs);
					if(d <= params.radius + 0.5 && (blockID==0 || blockID==106)){
						World.setFullBlock(x + xs, y + ys, z + zs, leaves);
					}
				}
			}
		}
	},

	generateRubberTree: function(x, y, z){
		RubberTreeGenerationHelper.generateCustomTree(x, y, z, {
			log: {
				id: BlockID.rubberTreeLog,
				data: 0,
				resin: BlockID.rubberTreeLogLatex
			},
			leaves: {
				id: BlockID.rubberTreeLeaves,
				data: 0
			},
			height: {
				min: 4,
				max: 8,
				start: 2 + parseInt(Math.random() * 2)
			},
			pike: 2 + parseInt(Math.random() * 1.5),
			radius: 2
		});
	}
}


var ForestBiomeIDs = [4, 18, 27, 28];
var JungleBiomeIDs = [21, 22, 23, 149, 151];
var SwampBiomeIDs = [6, 134];

var RUBBER_TREE_BIOME_DATA = {
	1: __config__.getNumber("rubber_tree_gen.plains")/100
}
var chance = __config__.getNumber("rubber_tree_gen.forest")/100;
if(chance){
	for(var id in ForestBiomeIDs){
	RUBBER_TREE_BIOME_DATA[ForestBiomeIDs[id]] = chance;}
}
chance = __config__.getNumber("rubber_tree_gen.jungle")/100;
if(chance){
	for(var id in JungleBiomeIDs){
	RUBBER_TREE_BIOME_DATA[JungleBiomeIDs[id]] = chance;}
}
chance = __config__.getNumber("rubber_tree_gen.swamp")/100;
if(chance){
	for(var id in SwampBiomeIDs){
	RUBBER_TREE_BIOME_DATA[SwampBiomeIDs[id]] = chance;}
}

Callback.addCallback("GenerateChunk", function(chunkX, chunkZ){
	if(Math.random() < RUBBER_TREE_BIOME_DATA[World.getBiome((chunkX + 0.5) * 16, (chunkZ + 0.5) * 16)]){
		for(var i = 0; i < 1 + Math.random() * 5; i++){
			var coords = GenerationUtils.randomCoords(chunkX, chunkZ, 64, 128);
			coords = GenerationUtils.findSurface(coords.x, coords.y, coords.z);
			if(World.getBlockID(coords.x, coords.y, coords.z) == 2){
				coords.y++;
				RubberTreeGenerationHelper.generateRubberTree(coords.x, coords.y, coords.z);
			}
		}
	}
});
