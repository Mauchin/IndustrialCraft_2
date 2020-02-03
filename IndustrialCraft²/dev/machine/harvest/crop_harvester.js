IDRegistry.genBlockID("cropHarvester");
Block.createBlock("cropHarvester", [
	{name: "Crop Harvester", texture: [["machine_bottom", 0], ["crop_harvester", 0]], inCreative: true}
], "opaque");
//TileRenderer.setStandartModel(BlockID.cropHarvester, [["machine_bottom", 0], ["crop_harvester", 0]]);

ItemName.addTierTooltip("cropHarvester", 1);

Block.registerDropFunction("cropHarvester", function(coords, blockID, blockData, level){
	return MachineRegistry.getMachineDrop(coords, blockID, level, BlockID.machineBlockBasic);
});

Callback.addCallback("PreLoaded", function(){
    Recipes.addShaped({id: BlockID.cropHarvester, count: 1, data: 0}, [
        "zxz",
        "asa",
        "wqw"
    ], ['z', ItemID.circuitBasic, 0, 'x', 54, 0, 'a', 359, -1, 's',  BlockID.machineBlockBasic, 0,'w',  ItemID.plateIron, 0,'q',  ItemID.agriculturalAnalyzer, 0]);
});

var cropHarvesterGuiObject = {
    outputSlotsNames: [],
    standart: {
        header: {text: {text: Translation.translate("Crop Harvester")}},
        inventory: {standart: true},
        background: {standart: true}
    },

    drawing: [
        {type: "bitmap", x: 845, y: 120, bitmap: "energy_small_background", scale: GUI_SCALE}
    ],

    elements: {
        "energyScale": {type: "scale", x: 845, y: 120, direction: 1, value: 0.5, bitmap: "energy_small_scale", scale: GUI_SCALE},
        "slotEnergy": {type: "slot", x: 840, y: 170, isValid: MachineRegistry.isValidEUStorage},
		"slotAnalyser": {type: "slot", x: 440, y: 170, isValid: function(id, count, data){
			return id == ItemID.agriculturalAnalyzer
		}},
		"slotUpgrade": {type: "slot", x: 640, y: 310, isValid: UpgradeAPI.isUpgrade}
    }
};

cropHarvesterGuiObject.outputSlotsNames["slotAnalyser"] = {
    input: true,
    isValid: function(id){
        return id == ItemID.agriculturalAnalyzer
    }
};

for(let ind = 0; ind < 15; ind++){
    let x = ind % 5;
    let y = Math.floor(ind / 5) + 1;
    let padd = 60;
    cropHarvesterGuiObject.outputSlotsNames["outSlot" + ind] = {output: true};
    cropHarvesterGuiObject.elements["outSlot" + ind] = {type: "slot", x: 520 + padd * x, y: 50 + padd * y};
}

var guiCropHarvester = new UI.StandartWindow(cropHarvesterGuiObject);
Callback.addCallback("LevelLoaded", function(){
	MachineRegistry.updateGuiHeader(guiCropHarvester, "Crop Harvester");
});

MachineRegistry.registerElectricMachine(BlockID.cropHarvester, {
    defaultValues: {
        power_tier: 1,
        energy_storage: 10000,
        scanX:-5,
        scanY:-1,
        scanZ:-5
    },
    upgrades: [ "transformer", "energyStorage", "itemEjector"],
    getGuiScreen: function(){
        return guiCropHarvester;
    },
    getTier: function(){
        return this.data.power_tier;
    },
    setDefaultValues: function(){
        this.data.power_tier = this.defaultValues.power_tier;
        this.data.energy_storage = this.defaultValues.energy_storage;
    },

    tick: function(){
        this.setDefaultValues();
        UpgradeAPI.executeUpgrades(this);

        if(this.data.energy>200) this.scan();

        var tier = this.getTier();
        var energyStorage = this.getEnergyStorage();
        this.data.energy = Math.min(this.data.energy, energyStorage);
        this.data.energy += ChargeItemRegistry.getEnergyFrom(this.container.getSlot("slotEnergy"), "Eu", energyStorage - this.data.energy, transferByTier[tier], tier);

        this.container.setScale("energyScale", this.data.energy / energyStorage);
        this.container.validateAll();
	},

	scan: function(){
        this.data.scanX++;
        if (this.data.scanX > 5) {
            this.data.scanX = -5;
            this.data.scanZ++;
            if (this.data.scanZ > 5) {
                this.data.scanZ = -5;
                this.data.scanY++;
                if (this.data.scanY > 1) {
                    this.data.scanY = -1;
                }
            }
        }
        this.data.energy -= 1;
        var cropTile = World.getTileEntity(this.x + this.data.scanX, this.y + this.data.scanY, this.z + this.data.scanZ);
        if(cropTile && cropTile.crop && !this.isInvFull()){
            var cropAnalyser = this.container.getSlot("slotAnalyser");
            var drops = null;
            if(cropAnalyser.id && cropTile.data.currentSize == cropTile.crop.getOptimalHarvestSize(cropTile)){
                drops = cropTile.performHarvest();
            }
            else if (cropTile.data.currentSize == cropTile.crop.maxSize) {
                drops = cropTile.performHarvest();
            }
            if(drops && drops.length){
                for(var ind in drops){
                    var item = drops[ind];
                    this.putItem(item);
                    this.data.energy -= 100
                    if(!cropAnalyser.id) this.data.energy -= 100;

                    if(item.count > 0){
                        nativeDropItem(this.x, this.y + 1, this.z, 0, item.id, item.count, item.data, null);
                    }
                }
            }
        }
    },
    putItem: function(item){
        for(var i = 0; i < 15; i++){
            var slott = this.container.getSlot("outSlot" + i);
            if(!slott.id || slott.id == item.id && slott.count < Item.getMaxStack(item.id)){
                var putCount = Math.min(Item.getMaxStack(item.id) - slott.count, item.count);
                slott.id = item.id;
                slott.count += putCount;
                slott.data = item.data;
                item.count -= putCount;
            }
        }
    },
    isInvFull: function(){
        for(var i = 0; i < 15; i++){
            var slot = this.container.getSlot("outSlot" + i);
            var maxStack = Item.getMaxStack(slot.id);
            if(!slot.id || slot.count < maxStack) return false;
        }
        return true;
    },

    getEnergyStorage: function(){
        return this.data.energy_storage;
    },
    energyReceive: MachineRegistry.basicEnergyReceiveFunc
});
StorageInterface.createInterface(BlockID.cropHarvester, {
	slots: cropHarvesterGuiObject.outputSlotsNames
});