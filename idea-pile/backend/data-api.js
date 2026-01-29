class dataapi {
    constructor() {
        this.data = new Map();
    }

    getData() {
        return this.data;
    }

    setData(id, data) {
        this.data.set(id, data);
    }

    editData(id, newData) {
        if (this.data.has(id)) {
            this.data.set(id, this.data.get(id).editData(newData));
        } else {
            throw new Error("Data with the given ID does not exist :" + id);
        }
    }
}