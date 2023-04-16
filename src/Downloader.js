import React, { Component } from 'react'
import { v4 as uuidv4 } from 'uuid';
import './Downloader.css';
import { download } from './utility';
import { Link } from 'react-router-dom';
class Downloader extends Component {
    constructor(props) {
        super(props)
        this.state = {
            inputs: {
                // id:value
                'my_secret_id': 'past lives',
                'my_secret_id_2': '',
            },
            notification: [],
            ready: false,
            loader: false,
        }
    }

    handleChange = (evt) => {
        const id = evt.target.id
        const value = evt.target.value
        this.setState(st => {

            let newInputs = st.inputs

            if (value !== '')
                newInputs[id] = value
            else
                delete newInputs[id]
            return { inputs: newInputs }
        })
    }

    handleBeforeInput = (evt) => {
        const id = evt.target.id
        const value = evt.target.value
        if (value === '')
            this.addNewInput()
    }

    addNewInput = () => {
        const id = uuidv4()
        this.setState(st => {
            let newInputs = st.inputs
            newInputs[id] = ''
            return { inputs: newInputs }
        })
    }

    handleSubmit = async (e) => {
        this.setState({ ready: false, loader: true })
        const songs = Object.values(this.state.inputs).filter(val => val != '')
        const res = await download(songs)
        this.setState({ ready: true, loader: false })
        // this.addNotification(res.data)
    }

    addNotification = (obj) => {
        this.setState(st => ({ notification: [...st.notification, JSON.stringify(obj)] }))
    }

    render() {
        const createInput = (id) => {
            const value = this.state.inputs[id]
            return (
                <input type='text' key={id} id={id} value={value} onBeforeInput={this.handleBeforeInput} onInput={this.handleChange} />
            )
        }
        return (
            <div className='Downloader'>
                <div className='InputContainer'>
                    {
                        // createInput('my_secret_id')
                        Object.keys(this.state.inputs)
                            .map(id => createInput(id))
                    }

                </div>
                <button type='submit' onClick={this.handleSubmit}>Submit</button>
                {this.state.ready ? <Link to={`http://localhost:8888/download`}>Download here</Link> : null}

                <br />
                {this.state.loader ? <div className='loader'></div> : null}
                <br />
                {this.state.notification.map(el => <span key={uuidv4()}>{el}</span>)}
            </div>
        )
    }
}

export default Downloader