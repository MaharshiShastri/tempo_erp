import { useMemo, useState } from "react";

export default function SearchableMultiSelect({label, options = [], value=[], onChange}){

    const [search, setSearch] = useState("");

    const filtered = useMemo(
        () => (options ?? []).filter(option =>
            option.toLowerCase().includes(search.toLowerCase())
        ),
        [options, search]
    );

    return(

        <div style={{width:320}}>

            <b>{label} ({options?.length})</b>

            <input className="form-input" placeholder={`Search ${label}`} value={search}onChange={e=>setSearch(e.target.value)}/>

            <div
                style={{ maxHeight:220, overflowY:"auto", border:"1px solid #ddd", borderRadius:6, padding:8,marginTop:6}}>

                <label>
                    
                    <input type="checkbox" checked={value.length===options.length} onChange={e=> onChange( e.target.checked ? options : [])}/>
                    Select All

                </label>

                <hr/>

                {

                    filtered.map(option=>

                        <label key={option} style={{ display:"block",marginBottom:6}}>

                            <input type="checkbox" checked={value.includes(option)} onChange={e=>{ 
                                if(e.target.checked){

                                        onChange([...value, option]);

                                    }else{

                                        onChange(value.filter(s=>s!==option)

                                        );

                                    }

                                }}

                            />

                            {" "}

                            {option}

                        </label>

                    )

                }

            </div>

        </div>

    );

}