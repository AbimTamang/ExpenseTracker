import React, { useEffect, useState } from "react";
import "./Analytics.css";
import { useNavigate } from "react-router-dom";

import {

  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer

} from "recharts";


const Analytics = () => {

  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const [data,setData] = useState([]);




  useEffect(()=>{

    fetch(

      "http://localhost:5000/api/expenses",

      {

        headers:{

          Authorization:`Bearer ${token}`

        }

      }

    )
    .then(res=>res.json())
    .then(result=>{

      if(result.success){

        const income =
          result.data
          .filter(i=>i.type==="income")
          .reduce((a,b)=>a+b.amount,0);

        const expense =
          result.data
          .filter(i=>i.type==="expense")
          .reduce((a,b)=>a+b.amount,0);


        setData([

          {
            name:"Income",
            value:income
          },

          {
            name:"Expense",
            value:expense
          }

        ]);

      }

    });

  },[]);




  const COLORS = [

    "#00C49F",

    "#FF8042"

  ];



  return(

<div className="analytics-page">



<button
onClick={()=>navigate("/dashboard")}
className="back"
>

← Dashboard

</button>


<h1>Analytics</h1>




<div className="chart">


<ResponsiveContainer width="100%" height={400}>


<PieChart>


<Pie

data={data}

dataKey="value"

nameKey="name"

outerRadius={150}

>

{

data.map((entry,index)=>(

<Cell

key={index}

fill={COLORS[index]}

/>

))

}


</Pie>


<Tooltip/>

<Legend/>


</PieChart>


</ResponsiveContainer>


</div>


</div>

);

};

export default Analytics;