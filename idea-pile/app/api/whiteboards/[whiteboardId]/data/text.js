class text extends data {
    constructor(text){
        this.text = text;
    }

    editText(newText){
        this.text = newText;
    }

    print(){
        super.print();
        console.log(this.text);
    }
}

export default text;