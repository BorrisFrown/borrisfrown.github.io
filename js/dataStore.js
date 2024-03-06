class DataStore {
    constructor() {
      this.selectedData = null;
      this.listeners = [];
    }
  
    setSelectedData(data) {
      this.selectedData = data;
      this.notifyListeners();
    }
  
    getSelectedData() {
      return this.selectedData;
    }
  
    registerListener(listener) {
      this.listeners.push(listener);
    }
  
    unregisterListener(listener) {
      this.listeners = this.listeners.filter(l => l !== listener);
    }
  
    notifyListeners() {
      this.listeners.forEach(listener => {
        listener.update(this.selectedData);
      });
    }
  }
  
  export default DataStore;
  